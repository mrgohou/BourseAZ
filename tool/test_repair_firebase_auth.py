"""Owner-tool tests: no network, no live accounts, no administrative changes."""
import base64
import copy
import json
import unittest
import repair_firebase_auth as r


class FirebaseStub:
    def __init__(self, registered=True, configured=False):
        self.auth = {"name": f"projects/{r.PROJECT}/config", "signIn": {
            "email": {"enabled": configured, "passwordRequired": False},
            "phoneNumber": {"enabled": True}, "allowDuplicateEmails": False},
            "client": {"permissions": {"disabledUserSignup": not configured,
                                       "disabledUserDeletion": True}},
            "authorizedDomains": ["boursefacile.ai.studio"]}
        self.google = {"name": f"projects/{r.PROJECT}/defaultSupportedIdpConfigs/google.com",
                       "enabled": configured, "clientId": r.WEB_CLIENT,
                       "clientSecret": "never-return-or-change-this"}
        self.app = {"name": f"projects/{r.PROJECT}/androidApps/android-app",
                    "packageName": r.PACKAGE, "state": "ACTIVE"} if registered else None
        self.certs = [{"certType": "SHA_1", "shaHash": r.SHA1},
                      {"certType": "SHA_256", "shaHash": r.SHA256}] if configured else []
        self.calls = []
        self.oauth_present = True
        self.paginate = False
        self.operation_error = False

    def request(self, service, path, method="GET", body=None, query=None):
        self.calls.append((service, path, method, copy.deepcopy(body), query))
        if path.endswith("/defaultSupportedIdpConfigs/google.com"):
            self.assert_fields(query, "name,enabled,clientId")
            if method == "PATCH":
                assert query["updateMask"] == "enabled" and body == {"enabled": True}
                self.google["enabled"] = True
            return {k: self.google[k] for k in ["name", "enabled", "clientId"]}
        if service == "identitytoolkit":
            assert path == f"v2/projects/{r.PROJECT}/config"
            self.assert_fields(query, r.AUTH_FIELDS)
            if method == "PATCH":
                mask = query["updateMask"].split(",")
                assert set(mask) <= {"signIn.email.enabled", "client.permissions.disabledUserSignup"}
                if "signIn.email.enabled" in mask:
                    self.auth["signIn"]["email"]["enabled"] = body["signIn"]["email"]["enabled"]
                if "client.permissions.disabledUserSignup" in mask:
                    self.auth["client"]["permissions"]["disabledUserSignup"] = body["client"]["permissions"]["disabledUserSignup"]
            return copy.deepcopy(self.auth)
        if path.endswith("/androidApps"):
            if method == "POST":
                assert body["packageName"] == r.PACKAGE
                if self.operation_error:
                    return {"done": True, "error": {"code": 7}}
                self.app = {"name": f"projects/{r.PROJECT}/androidApps/new-app",
                            "packageName": r.PACKAGE, "state": "ACTIVE"}
                return {"done": True, "response": copy.deepcopy(self.app)}
            if self.paginate and "pageToken" not in query:
                return {"apps": [{"name": "unrelated-app", "packageName": "another.package"}],
                        "nextPageToken": "next"}
            return {"apps": [copy.deepcopy(self.app)] if self.app else []}
        if path.endswith("/sha"):
            if method == "POST":
                self.certs.append(copy.deepcopy(body))
                return body
            return {"certificates": copy.deepcopy(self.certs)}
        if path.endswith("/config"):
            oauth = [{"client_type": 3, "client_id": r.WEB_CLIENT}]
            if self.oauth_present and any(c["shaHash"] == r.SHA1 for c in self.certs):
                oauth.append({"client_type": 1, "android_info": {
                    "package_name": r.PACKAGE, "certificate_hash": r.SHA1}})
            config = {"project_info": {"project_id": r.PROJECT}, "client": [{
                "client_info": {"android_client_info": {"package_name": r.PACKAGE}},
                "oauth_client": oauth}]}
            return {"configFileContents": base64.b64encode(json.dumps(config).encode()).decode()}
        raise AssertionError((service, path, method))

    @staticmethod
    def assert_fields(query, expected):
        assert query["fields"] == expected

    def mutations(self):
        return [c for c in self.calls if c[2] != "GET"]


class RepairTests(unittest.TestCase):
    def test_default_only_reads_even_when_both_auth_methods_are_disabled(self):
        api = FirebaseStub(registered=False)
        result = r.repair(api)
        self.assertFalse(result["email_enabled"])
        self.assertFalse(result["android_registered"])
        self.assertEqual(api.mutations(), [])
        self.assertNotIn("never-return-or-change-this", json.dumps(result))

    def test_apply_repairs_configuration_and_is_idempotent(self):
        api = FirebaseStub(registered=False)
        first = r.repair(api, apply=True)
        self.assertTrue(first["email_enabled"])
        self.assertTrue(first["user_signup_allowed"])
        self.assertTrue(first["google_enabled"])
        self.assertTrue(first["android_oauth_matches_apk"])
        self.assertEqual(len(api.certs), 2)
        self.assertTrue(api.auth["signIn"]["phoneNumber"]["enabled"])
        self.assertFalse(api.auth["signIn"]["email"]["passwordRequired"])
        self.assertTrue(api.auth["client"]["permissions"]["disabledUserDeletion"])
        self.assertEqual(api.auth["authorizedDomains"], ["boursefacile.ai.studio"])
        self.assertEqual(api.google["clientSecret"], "never-return-or-change-this")
        api.calls.clear()
        second = r.repair(api, apply=True)
        self.assertEqual(second["changes"], [])
        self.assertEqual(api.mutations(), [])

    def test_existing_app_on_second_page_is_reused(self):
        api = FirebaseStub()
        api.paginate = True
        result = r.repair(api, apply=True)
        self.assertTrue(result["android_registered"])
        self.assertFalse(any(c[1].endswith("/androidApps") for c in api.mutations()))

    def test_wrong_project_is_rejected_before_any_change(self):
        api = FirebaseStub()
        api.auth["name"] = "projects/another-project/config"
        with self.assertRaises(r.RepairError):
            r.repair(api, apply=True)
        self.assertEqual(api.mutations(), [])

    def test_wrong_google_client_is_not_overwritten(self):
        api = FirebaseStub()
        api.google["clientId"] = "different-client"
        with self.assertRaises(r.RepairError):
            r.repair(api, apply=True)
        self.assertEqual(api.mutations(), [])

    def test_missing_android_oauth_is_not_reported_as_repaired(self):
        api = FirebaseStub(configured=True)
        api.oauth_present = False
        result = r.repair(api, apply=True)
        self.assertFalse(result["android_oauth_matches_apk"])
        self.assertEqual(api.mutations(), [])

    def test_registration_error_stops_before_signatures_or_login(self):
        api = FirebaseStub(registered=False, configured=True)
        api.operation_error = True
        with self.assertRaises(r.RepairError):
            r.repair(api, apply=True)
        self.assertEqual(len(api.mutations()), 1)
        self.assertFalse(any(c[1].endswith(":signUp") for c in api.calls))

    def test_android_oauth_must_match_package_and_certificate_together(self):
        config = {"project_info": {"project_id": r.PROJECT}, "client": [{
            "client_info": {"android_client_info": {"package_name": r.PACKAGE}},
            "oauth_client": [{"client_type": 3, "client_id": r.WEB_CLIENT}, {
                "client_type": 1, "android_info": {"package_name": "wrong.package",
                                                   "certificate_hash": r.SHA1}}]}]}
        self.assertFalse(r.valid_android_oauth(config))


if __name__ == "__main__":
    unittest.main()
