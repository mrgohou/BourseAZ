// Public client identifiers already used by the web application.
abstract final class AccountConfig {
  static const apiKey = "AIzaSyDPfpwxyJNsDLOH69jlOq6PLbjJN1yemkE";
  static const authDomain = "third-storm-9w532.firebaseapp.com";
  static const googleServerClientId =
      "633926810372-llrqiu8i3jsk22v0mvm6vjf98lbeomts.apps.googleusercontent.com";
  static const googleIosClientId = String.fromEnvironment(
    'GOOGLE_IOS_CLIENT_ID',
  );
}
