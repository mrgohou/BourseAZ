import importlib.util,plistlib,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('configure_ios',Path(__file__).with_name('configure_ios.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class IOSConfigurationTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);self.path=self.root/'ios/Runner/Info.plist';self.path.parent.mkdir(parents=True);self.path.write_bytes(plistlib.dumps({'CFBundleDisplayName':'Bourse Facile'}))
 def tearDown(self):self.temp.cleanup()
 def test_configuration_is_idempotent_and_return_url_matches_client(self):
  for _ in range(2):module.configure(self.root,'123-example.apps.googleusercontent.com')
  info=plistlib.loads(self.path.read_bytes());self.assertEqual(len(info['CFBundleURLTypes']),1);self.assertEqual(info['CFBundleURLTypes'][0]['CFBundleURLSchemes'],['com.googleusercontent.apps.123-example'])
  module.configure(self.root);self.assertNotIn('GIDClientID',plistlib.loads(self.path.read_bytes()))
 def test_wrong_firebase_project_and_bundle_rejected_before_writing(self):
  initial=self.path.read_bytes();config=self.root/'GoogleService-Info.plist';config.write_bytes(plistlib.dumps({'BUNDLE_ID':'other.app','PROJECT_ID':'other'}))
  with self.assertRaises(ValueError):module.configure(self.root,google_plist=config)
  self.assertEqual(self.path.read_bytes(),initial)
 def test_malformed_client_rejected(self):
  with self.assertRaises(ValueError):module.configure(self.root,'https://untrusted.example')
if __name__=='__main__':unittest.main()
