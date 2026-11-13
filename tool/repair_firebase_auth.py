"""Owner-side Firebase auth repair. Run in Google Cloud Shell; default is read-only.

No password, service-account key, OAuth secret, or user token is requested or saved.
This tool does not create test users. --apply only enables email authentication,
allows user signup, enables the existing Google provider, registers the exact APK package, and adds its public signatures.
Google provider credentials, other providers, domains and database rules are retained.
"""
import argparse
import base64
import json
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

PROJECT = "third-storm-9w532"
NUMBER = "633926810372"
PACKAGE = "ci.boursefacile.bourse_facile_mobile"
WEB_CLIENT = "633926810372-llrqiu8i3jsk22v0mvm6vjf98lbeomts.apps.googleusercontent.com"
SHA1 = "80c2c5373b9d72a88c5627abcd5f74619e6420b9"
SHA256 = "a5ecd7ec8e273ca1f52e9c6bd225605ce87d507a06a49d40be8f1abad25d4015"
AUTH_FIELDS = "name,signIn/email/enabled,client/permissions/disabledUserSignup"


class RepairError(Exception):
    pass


def normalized(value):
    return value.replace(":", "").lower()


class AdminAPI:
    def __init__(self, token):
        self.token = token

    def request(self, service, path, method="GET", body=None, query=None):
        if service not in {"firebase", "identitytoolkit"}:
            raise RepairError("Service inattendu ; aucune requête envoyée.")
        url = "https://" + service + ".googleapis.com/" + path
        if query:
            url += "?" + urllib.parse.urlencode(query)
        request = urllib.request.Request(
            url, method=method,
            data=json.dumps(body).encode() if body is not None else None,
            headers={"Authorization": "Bearer " + self.token,
                     "Content-Type": "application/json", "Accept": "application/json"},
        )
        # Never follow a redirect carrying the owner's authorization header.
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, *args, **kwargs):
                return None
        try:
            with urllib.request.build_opener(NoRedirect()).open(request, timeout=30) as response:
                data = response.read(2_000_001)
                if len(data) > 2_000_000:
                    raise RepairError("Réponse administrative trop volumineuse.")
                return json.loads(data)
        except urllib.error.HTTPError as error:
            # No response body: it could contain credentials or internal metadata.
            if error.code in {401, 403}:
                raise RepairError("Accès administrateur refusé (HTTP %s). Ouvre Cloud Shell avec le compte propriétaire du projet." % error.code) from None
            raise RepairError("API %s : HTTP %s. Aucune erreur brute ni clé n’est affichée." % (service, error.code)) from None
        except (urllib.error.URLError, TimeoutError, ValueError):
            raise RepairError("Service inaccessible ou réponse invalide. Réessaie depuis Cloud Shell.") from None


def valid_android_oauth(config):
    if config.get("project_info", {}).get("project_id") != PROJECT:
        return False
    clients = [c for c in config.get("client", [])
               if c.get("client_info", {}).get("android_client_info", {}).get("package_name") == PACKAGE]
    if len(clients) != 1:
        return False
    oauth = clients[0].get("oauth_client", [])
    web = any(c.get("client_type") == 3 and c.get("client_id") == WEB_CLIENT for c in oauth)
    android = any(c.get("client_type") == 1
                  and c.get("android_info", {}).get("package_name") == PACKAGE
                  and normalized(c.get("android_info", {}).get("certificate_hash", "")) == SHA1
                  for c in oauth)
    return web and android


def repair(api, apply=False, wait=time.sleep):
    auth_path = "v2/projects/" + PROJECT + "/config"
    config = api.request("identitytoolkit", auth_path, query={"fields": AUTH_FIELDS})
    if config.get("name") not in {"projects/" + PROJECT + "/config", "projects/" + NUMBER + "/config"}:
        raise RepairError("Le projet retourné ne correspond pas à Bourse Facile. Aucune modification.")
    email = config.get("signIn", {}).get("email", {}).get("enabled") is True
    signup = not config.get("client", {}).get("permissions", {}).get("disabledUserSignup", False)
    google_path = "v2/projects/" + PROJECT + "/defaultSupportedIdpConfigs/google.com"
    google_fields = "name,enabled,clientId"
    google = api.request("identitytoolkit", google_path, query={"fields": google_fields})
    google_enabled = google.get("enabled") is True
    google_client_matches = google.get("clientId") == WEB_CLIENT
    if apply and not google_client_matches:
        raise RepairError("Le client Google web ne correspond pas à celui de l’APK. Aucune modification ; vérifier le projet dans la console.")
    parent = "v1beta1/projects/" + PROJECT + "/androidApps"
    apps, page = [], None
    while True:
        query = {"pageSize": 100}
        if page:
            query["pageToken"] = page
        data = api.request("firebase", parent, query=query)
        apps.extend(data.get("apps", []))
        page = data.get("nextPageToken")
        if not page:
            break
    matches = [a for a in apps if a.get("packageName") == PACKAGE and a.get("state", "ACTIVE") == "ACTIVE"]
    if len(matches) > 1:
        raise RepairError("Plusieurs applications correspondent au package ; vérification manuelle requise.")
    app = matches[0] if matches else None
    result = {"project": PROJECT, "package": PACKAGE, "mode": "apply" if apply else "read-only",
              "email_enabled": email, "user_signup_allowed": signup,
              "android_registered": app is not None, "google_enabled": google_enabled,
              "google_web_client_matches": google_client_matches, "changes": []}
    if apply:
        body, mask = {}, []
        if not email:
            body["signIn"] = {"email": {"enabled": True}}
            mask.append("signIn.email.enabled")
        if not signup:
            body["client"] = {"permissions": {"disabledUserSignup": False}}
            mask.append("client.permissions.disabledUserSignup")
        if mask:
            api.request("identitytoolkit", auth_path, "PATCH", body,
                        {"updateMask": ",".join(mask), "fields": AUTH_FIELDS})
            result["changes"].extend(mask)
        if not google_enabled:
            api.request("identitytoolkit", google_path, "PATCH", {"enabled": True},
                        {"updateMask": "enabled", "fields": google_fields})
            result["changes"].append("google_enabled")
        if app is None:
            operation = api.request("firebase", parent, "POST",
                                    {"packageName": PACKAGE, "displayName": "Bourse Facile Android"})
            for _ in range(30):
                if operation.get("error"):
                    raise RepairError("Création Android refusée. Vérifie les droits du projet dans la console.")
                if operation.get("done"):
                    app = operation.get("response")
                    break
                name = operation.get("name", "")
                if not name.startswith("operations/") or ".." in name or "?" in name:
                    raise RepairError("Opération de création inattendue. Vérifie la console avant de réessayer.")
                wait(2)
                operation = api.request("firebase", "v1beta1/" + name)
            if app is None:
                raise RepairError("Création Android en attente. Relance d’abord le diagnostic sans --apply.")
            result["changes"].append("android_registration")
    if app is not None:
        name = app.get("name", "")
        valid_parents = ("projects/" + PROJECT + "/androidApps/", "projects/" + NUMBER + "/androidApps/")
        if not name.startswith(valid_parents) or app.get("packageName") != PACKAGE:
            raise RepairError("Application Android inattendue ; arrêt avant l’ajout de signatures.")
        sha_path = "v1beta1/" + name + "/sha"
        certificates = api.request("firebase", sha_path).get("certificates", [])
        for kind, digest in [("SHA_1", SHA1), ("SHA_256", SHA256)]:
            present = any(c.get("certType") == kind and normalized(c.get("shaHash", "")) == digest for c in certificates)
            result[kind.lower() + "_registered"] = present
            if not present and apply:
                api.request("firebase", sha_path, "POST", {"certType": kind, "shaHash": digest})
                result["changes"].append(kind)
        payload = api.request("firebase", "v1beta1/" + name + "/config")
        try:
            public_config = json.loads(base64.b64decode(payload["configFileContents"], validate=True))
        except (KeyError, ValueError):
            raise RepairError("Configuration Android illisible. Télécharger google-services.json depuis Firebase.") from None
        result["android_oauth_matches_apk"] = valid_android_oauth(public_config)
    if apply:
        # Re-read after mutation. Do not call the configuration repaired just because a PATCH returned 200.
        after = repair(api, apply=False, wait=wait)
        after["mode"] = "apply"
        after["changes"] = result["changes"]
        return after
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Appliquer uniquement les changements décrits après le diagnostic.")
    args = parser.parse_args()
    try:
        executable = shutil.which("gcloud")
        if executable is None:
            raise RepairError("Ouvre Google Cloud Shell : gcloud doit y être disponible. Aucun secret à partager.")
        process = subprocess.run([executable, "auth", "print-access-token", "--quiet"],
                                 capture_output=True, text=True, check=False)
        token = process.stdout.strip()
        if process.returncode or not token or any(c.isspace() for c in token):
            raise RepairError("Authentifie ton compte propriétaire dans Cloud Shell ; ne colle aucun jeton ici.")
        result = repair(AdminAPI(token), apply=args.apply)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        ready = (result["email_enabled"] and result["user_signup_allowed"]
                 and result["google_enabled"] and result["google_web_client_matches"]
                 and result.get("sha_1_registered") and result.get("android_oauth_matches_apk"))
        if not ready:
            print("Configuration incomplète : voir docs/REPARATION_CONNEXION.md. Aucun test Google sur téléphone n’a été effectué.")
            return 2
        print("Contrôles de configuration réussis. Tester maintenant e-mail puis Google dans l’APK existant.")
        return 0
    except RepairError as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
