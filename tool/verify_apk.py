"""Check a profile/release ARM64 Flutter APK without Android tools or credentials."""
import argparse,hashlib,zipfile
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__);p.add_argument('apk',type=Path);a=p.parse_args()
with zipfile.ZipFile(a.apk) as z:
 assert z.testzip() is None,'Archive APK endommagée'
 for name in ['AndroidManifest.xml','lib/arm64-v8a/libapp.so','lib/arm64-v8a/libflutter.so']:
  assert name in z.namelist(),'Sortie native obligatoire manquante : '+name
 assert z.getinfo('lib/arm64-v8a/libapp.so').file_size>0,'Bibliothèque Dart AOT vide'
 assert not any('/test/fixtures/' in n or 'review_main' in n for n in z.namelist()),'Fichiers de revue/test embarqués'
print('APK ARM64 : archive et bibliothèques Flutter/Dart présentes.')
print('SHA-256 : '+hashlib.sha256(a.apk.read_bytes()).hexdigest())
print('La signature et la connexion Google réelle nécessitent leurs contrôles séparés.')
