// First-party resources verified against the BRVM directory and Bridge's site.
// This allowlist does not authorize a broker's private account API.
const bridgeWebsiteUrl = 'https://www.bridge-securities.com/';
const bridgeToolsUrl =
    'https://www.bridge-securities.com/nos-offres/nos-outils';
const bridgeClientInfoUrl = 'https://www.bridge-securities.com/devenir-client';
const bridgePortalUrl = 'https://bstrade.bridge-securities.com/';
const bridgeTariffUrl =
    'https://www.bridge-securities.com/images/documents/tarification-compte-titre.pdf';
bool verifiedBrokerDocument(String value) => value == bridgeTariffUrl;
bool verifiedBrokerPublicLink(String value) => const {
  bridgeWebsiteUrl,
  bridgeToolsUrl,
  bridgeClientInfoUrl,
  bridgePortalUrl,
  bridgeTariffUrl,
}.contains(value);
bool isBridgeBroker(String? name) =>
    name?.trim().toUpperCase() == 'BRIDGE SECURITIES';
