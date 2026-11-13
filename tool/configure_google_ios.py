"""Configure Google's public iOS OAuth client ID after registering the app."""
import argparse,plistlib,re
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--client-id',required=True);args=parser.parse_args()
if not re.fullmatch(r'[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com',args.client_id):parser.error('Expected an iOS OAuth client ID ending in .apps.googleusercontent.com')
root=Path(__file__).resolve().parents[1];p=root/'ios/Runner/Info.plist';data=plistlib.loads(p.read_bytes())
config=(root/'lib/data/account_config.dart').read_text();match=re.search(r"googleServerClientId\s*=\s*['\"]([^'\"]+)",config)
if not match:raise SystemExit('Public server client ID not found')
data['GIDClientID']=args.client_id;data['GIDServerClientID']=match.group(1)
scheme='com.googleusercontent.apps.'+args.client_id.split('.apps.googleusercontent.com')[0]
urls=[x for x in data.get('CFBundleURLTypes',[]) if x.get('CFBundleURLName')!='google-sign-in']
urls.append({'CFBundleTypeRole':'Editor','CFBundleURLName':'google-sign-in','CFBundleURLSchemes':[scheme]});data['CFBundleURLTypes']=urls
p.write_bytes(plistlib.dumps(data));print('Public Google OAuth configuration added to ios/Runner/Info.plist')
