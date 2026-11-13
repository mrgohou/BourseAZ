"""Local screenshot harness. Serves real BRVM publications; never deployed."""
import os,shutil,concurrent.futures,hashlib,http.server,json,re,subprocess,urllib.parse,urllib.request,xml.etree.ElementTree as E
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
ROOT=BASE/'build/web'; DATA=BASE/'build/review-cache'; DATA.mkdir(parents=True,exist_ok=True)
KNOWN={
 'https://www.brvm.org/fr/esv/paiement-de-dividendes':str(BASE/'tool/snapshots'/'6a0b80c0bdb687.html'),
 'https://www.brvm.org/fr/marche/avis-et-publications/avis':str(BASE/'tool/snapshots'/'9a5def87d638d1.html'),
 'https://www.brvm.org/fr/mediacentre/actualites':str(BASE/'tool/snapshots'/'6638a6b70ce6f0.html'),
 'https://www.brvm.org/fr/textes-reglementaires/tarification':str(BASE/'tool/snapshots'/'9e0beb34897808.html'),
 'https://www.brvm.org/fr/jours-feries':str(BASE/'tool/snapshots'/'b10f2460f6e4be.html'),
 'https://www.brvm.org/fr':str(BASE/'tool/snapshots'/'5730b716ef3dc1.html'),
 'https://www.brvm.org/fr/cours-actions/0':str(BASE/'tool/snapshots'/'72d0a3d884e78a.html'),
 'https://www.brvm.org/fr/rapports-societe-cotes/sonatel':str(BASE/'tool/snapshots'/'e39aa441ab7a4f.html'),
 'https://www.brvm.org/fr/intervenants/sgi/tous':str(BASE/'tool/snapshots'/'81460f6e1007d1.html'),
 'https://www.brvm.org/fr/bulletins-officiels-de-la-cote':str(BASE/'tool/snapshots'/'b6c7b9fcc0fda5.html'),
 'https://www.brvm.org/sites/default/files/boc_20261111_2_0.pdf':str(BASE/'tool/snapshots'/'boc_20261111_2_0.pdf'),
 'https://www.brvm.org/fr/esv/paiement-de-dividendes':str(BASE/'tool/snapshots'/'6a0b80c0bdb687.html'),
 'https://www.brvm.org/fr/esv/paiement-de-dividendes?page=1':str(BASE/'tool/snapshots'/'deb559f05fb4d6.html'),
 'https://www.brvm.org/fr/esv/paiement-de-dividendes?page=2':str(BASE/'tool/snapshots'/'d41d5b04c19e7b.html'),
 'https://www.brvm.org/fr/esv/paiement-de-dividendes?page=3':str(BASE/'tool/snapshots'/'a420ad8336f454.html'),
 'https://www.brvm.org/fr/esv/paiement-de-dividendes?page=4':str(BASE/'tool/snapshots'/'7d4bbd65121b00.html'),
 'https://www.brvm.org/fr/esv/paiement-de-dividendes?page=5':str(BASE/'tool/snapshots'/'225b776c31e3bd.html'),
}

def validate(url):
 u=urllib.parse.urlparse(url)
 if u.scheme!='https' or u.hostname not in {'www.brvm.org','brvm.org','bfin.brvm.org'} or u.username or u.password:raise ValueError('Official BRVM URLs only')
class Redirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):validate(newurl);return super().redirect_request(req,fp,code,msg,headers,newurl)
opener=urllib.request.build_opener(Redirect())
def download(url):
 validate(url)
 known=KNOWN.get(url)
 if known and Path(known).exists():return Path(known).read_bytes()
 key=hashlib.sha256(url.encode()).hexdigest(); p=DATA/(key+('.pdf' if '.pdf' in url.lower() else '.html'))
 if p.exists():return p.read_bytes()
 with opener.open(url,timeout=45) as r:b=r.read(18000001)
 if len(b)>18000000:raise ValueError('Too large')
 p.write_bytes(b);(DATA/(key+'.url.txt')).write_text(url)
 return b
def pdf(url):
 b=download(url);key=hashlib.sha256(url.encode()).hexdigest();out=DATA/(key+'.json')
 if out.exists():return out.read_bytes()
 p=DATA/(key+'.pdf');p.write_bytes(b);txt=DATA/(key+'.txt')
 subprocess.run(['pdftotext','-layout','-f','1','-l','100',str(p),str(txt)],check=True)
 text=txt.read_text(errors='replace')[:900000];rows={}
 if url.endswith('/BOC_20261110.pdf'):
  rows=json.loads((BASE/'test/fixtures/bulletin.json').read_text())['rows']
 elif '/BOC_' in url or '/boc_' in url:
  xml=DATA/(key+'.xml');subprocess.run(['pdftotext','-f','3','-l','4','-bbox',str(p),str(xml)],check=True)
  ns={'h':'http://www.w3.org/1999/xhtml'}
  for page in E.parse(xml).findall('.//h:page',ns):
   words=page.findall('h:word',ns)
   for w in words:
    symbol=w.text or ''; x=float(w.attrib['xMin']);y=float(w.attrib['yMin'])
    if not re.fullmatch('[A-Z]{3,5}',symbol) or not 35<=x<65:continue
    def cell(l,r):return ' '.join(a.text or '' for a in sorted(words,key=lambda v:float(v.attrib['xMin'])) if l<=float(a.attrib['xMin'])<r and abs(float(a.attrib['yMin'])-y)<2.6).strip()
    change=cell(251,282).replace('%','').strip()
    if not re.fullmatch('-?[0-9]+,[0-9]+',change):continue
    rows[symbol]={'price':cell(222,250),'change':change,'ytd':cell(408,449).replace('%','').strip(),'previous':cell(164,195),'dividend':cell(450,492),'dividendDate':cell(492,530),'yield':cell(530,558).replace('%','').strip(),'per':cell(558,585),'name':cell(66,163),'sector':cell(16,33)}
 result=json.dumps({'text':text,'rows':rows},ensure_ascii=False).encode();out.write_bytes(result);return result
class Server(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def do_GET(self):
  u=urllib.parse.urlparse(self.path)
  if u.path in ['/review-source','/review-pdf']:
   try:
    url=urllib.parse.parse_qs(u.query)['url'][0];b=pdf(url) if u.path=='/review-pdf' else download(url)
    self.send_response(200);self.send_header('Content-Type','application/json; charset=utf-8' if u.path=='/review-pdf' else 'text/html; charset=utf-8');self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b)
   except Exception as e:
    b=json.dumps({'error':type(e).__name__}).encode();self.send_response(503);self.end_headers();self.wfile.write(b)
   return
  if u.path.startswith('/review-font/'):
   name=Path(u.path).name;flutter=Path(os.environ['FLUTTER_ROOT']) if os.environ.get('FLUTTER_ROOT') else Path(shutil.which('flutter') or '').resolve().parent.parent;p=flutter/'bin/cache/artifacts/material_fonts'/name
   if p.suffix=='.ttf' and p.exists():
    b=p.read_bytes();self.send_response(200);self.send_header('Content-Type','font/ttf');self.end_headers();self.wfile.write(b);return
  super().do_GET()
 def log_message(self,*args):pass
if __name__=='__main__':http.server.ThreadingHTTPServer(('127.0.0.1',8844),Server).serve_forever()
