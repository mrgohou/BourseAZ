"""Read-only validation of public Firebase Android configuration; never prints API keys."""
import argparse,json,sys
from pathlib import Path
PACKAGE='ci.boursefacile.bourse_facile_mobile'
PROJECT='third-storm-9w532'
SHA1='80c2c5373b9d72a88c5627abcd5f74619e6420b9'
WEB_CLIENT='633926810372-llrqiu8i3jsk22v0mvm6vjf98lbeomts.apps.googleusercontent.com'
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--config',type=Path,help='google-services.json téléchargé depuis le projet Firebase propriétaire')
a=p.parse_args()
if a.config is None:
 print(json.dumps({'project':PROJECT,'package_name':PACKAGE,'test_apk_sha1':':'.join(SHA1[i:i+2] for i in range(0,len(SHA1),2)).upper(),'console':'https://console.firebase.google.com/project/'+PROJECT+'/settings/general','next_step':'Enregistrer l’application Android et cette signature dans le projet du site ; activer Google dans Authentication. Vérifier ensuite le fichier public google-services.json avec --config.'},ensure_ascii=False,indent=2))
 sys.exit(0)
j=json.loads(a.config.read_text(encoding='utf-8-sig'))
assert j.get('project_info',{}).get('project_id')==PROJECT,'Projet différent de celui du site ; aucune modification automatique.'
clients=[c for c in j.get('client',[]) if c.get('client_info',{}).get('android_client_info',{}).get('package_name')==PACKAGE]
assert len(clients)==1,'L’application Android exacte doit être enregistrée.'
oauth=clients[0].get('oauth_client',[])
web=[c for c in oauth if c.get('client_type')==3]
assert any(c.get('client_id')==WEB_CLIENT for c in web),'Client OAuth web différent ; vérifier le projet et le serverClientId.'
android=[c for c in oauth if c.get('client_type')==1]
assert any(c.get('android_info',{}).get('package_name')==PACKAGE and c.get('android_info',{}).get('certificate_hash','').replace(':','').lower()==SHA1 for c in android),'Client OAuth Android ou SHA-1 absent du fichier. Vérifier la console Google Cloud/Firebase.'
print('Configuration publique cohérente : projet, package, client OAuth web et signature Android. Un test de connexion réel sur téléphone reste nécessaire.')
