"""Configure public Google OAuth iOS identifiers. No passwords/signing keys."""
import argparse,os,plistlib,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def configure(root,client_id='',google_plist=None):
    info_path=root/'ios/Runner/Info.plist'
    info=plistlib.loads(info_path.read_bytes())
    if google_plist:
        config=plistlib.loads(Path(google_plist).read_bytes())
        if config.get('BUNDLE_ID') != 'ci.boursefacile.bourseFacileMobile':
            raise ValueError('Le bundle iOS du fichier Google ne correspond pas au projet.')
        if config.get('PROJECT_ID') != 'third-storm-9w532':
            raise ValueError('Le projet Firebase ne correspond pas à Bourse Facile.')
        provided=config.get('CLIENT_ID','')
        if client_id and client_id != provided:
            raise ValueError('Les identifiants Google iOS ne correspondent pas.')
        client_id=provided
    urls=[item for item in info.get('CFBundleURLTypes',[]) if item.get('CFBundleURLName')!='google-oauth']
    if client_id:
        if not re.fullmatch(r'[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com',client_id):
            raise ValueError('Identifiant client OAuth iOS invalide.')
        scheme='com.googleusercontent.apps.'+client_id.removesuffix('.apps.googleusercontent.com')
        info['GIDClientID']=client_id
        info['GIDServerClientID']='633926810372-llrqiu8i3jsk22v0mvm6vjf98lbeomts.apps.googleusercontent.com'
        urls.append({'CFBundleURLName':'google-oauth','CFBundleTypeRole':'Editor','CFBundleURLSchemes':[scheme]})
    else:
        info.pop('GIDClientID',None);info.pop('GIDServerClientID',None)
    if urls: info['CFBundleURLTypes']=urls
    else: info.pop('CFBundleURLTypes',None)
    info_path.write_bytes(plistlib.dumps(info,sort_keys=False))
    return client_id
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--google-plist',type=Path);parser.add_argument('--client-id',default=os.environ.get('GOOGLE_IOS_CLIENT_ID',''));args=parser.parse_args()
    value=configure(ROOT,args.client_id,args.google_plist)
    print('Configuration Google iOS activée.' if value else 'Google iOS non configuré : connexion par e-mail disponible, bouton Google désactivé.')
