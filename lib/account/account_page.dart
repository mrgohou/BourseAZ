import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../features/widgets.dart';
import 'account_controller.dart';
import '../core/store.dart';
import '../portfolio/portfolio_controller.dart';
import '../portfolio/broker_profile_page.dart';

class AccountPage extends StatefulWidget {
  final AccountController account;
  final bool closeOnAuthenticated;
  final AppStore? store;
  const AccountPage(
    this.account, {
    this.closeOnAuthenticated = false,
    this.store,
    super.key,
  });
  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  final form = GlobalKey<FormState>();
  final email = TextEditingController(),
      password = TextEditingController(),
      confirmation = TextEditingController();
  String mode = 'login';
  bool obscure = true;
  @override
  void dispose() {
    email.dispose();
    password.dispose();
    confirmation.dispose();
    super.dispose();
  }

  void changeMode(String value) {
    widget.account.clearMessages();
    setState(() {
      mode = value;
      password.clear();
      confirmation.clear();
    });
  }

  void closeIfReady() {
    if (widget.closeOnAuthenticated &&
        widget.account.portfolioAllowed &&
        mounted) {
      Navigator.of(context).maybePop();
    }
  }

  Future<void> submit() async {
    if (!form.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    final account = widget.account;
    if (mode == 'reset') {
      await account.passwordReset(email.text);
      return;
    }
    final ok = mode == 'create'
        ? await account.emailSignUp(email.text, password.text)
        : await account.emailSignIn(email.text, password.text);
    if (ok && mounted) {
      TextInput.finishAutofillContext();
      password.clear();
      confirmation.clear();
      closeIfReady();
    }
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: widget.account,
    builder: (context, _) {
      final account = widget.account;
      final identity = account.identity;
      return Scaffold(
        appBar: AppBar(
          title: Text(identity == null ? 'Connexion' : 'Mon compte'),
        ),
        body: PageBody(
          children: [
            if (account.error != null || account.notice != null) ...[
              Semantics(
                liveRegion: true,
                child: Card(
                  color: account.error != null
                      ? Theme.of(context).colorScheme.errorContainer
                      : Theme.of(context).colorScheme.secondaryContainer,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(account.error ?? account.notice!),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
            if (account.initializing) ...[
              const SizedBox(height: 32),
              const Center(child: CircularProgressIndicator()),
              const SizedBox(height: 16),
              const Text('Vérification de la session…'),
              TextButton(
                onPressed: account.signOut,
                child: const Text('Utiliser un autre compte'),
              ),
            ] else if (identity != null) ...[
              Icon(
                identity.emailVerified
                    ? Icons.verified_user_outlined
                    : Icons.mark_email_unread_outlined,
                size: 52,
              ),
              const SizedBox(height: 16),
              Text(
                identity.emailVerified
                    ? 'Ton compte est connecté.'
                    : 'Vérifie ton adresse e-mail.',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 12),
              if (identity.displayName.isNotEmpty)
                Text(
                  identity.displayName,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              SelectableText(identity.email),
              const SizedBox(height: 20),
              if (!identity.emailVerified) ...[
                const Text(
                  'Ouvre le lien reçu par e-mail pour activer ton portefeuille personnel, puis reviens confirmer la vérification ici.',
                ),
                const SizedBox(height: 20),
                FilledButton.icon(
                  onPressed: account.busy
                      ? null
                      : () async {
                          await account.checkVerification();
                          closeIfReady();
                        },
                  icon: const Icon(Icons.refresh),
                  label: const Text('J’ai vérifié mon adresse'),
                ),
                TextButton(
                  onPressed: account.busy ? null : account.resendVerification,
                  child: const Text('Envoyer un lien'),
                ),
              ] else
                const Text(
                  'Ton portefeuille est associé à ce compte et sauvegardé dans le stockage sécurisé de cet appareil.',
                ),
              if (identity.emailVerified &&
                  widget.store != null &&
                  PortfolioScope.maybeOf(context) != null)
                BrokerProfileShortcut(
                  widget.store!,
                  PortfolioScope.maybeOf(context)!,
                ),
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: account.busy ? null : account.signOut,
                icon: const Icon(Icons.logout),
                label: const Text('Se déconnecter'),
              ),
            ] else ...[
              Text(
                mode == 'create'
                    ? 'Un compte pour\ntes investissements.'
                    : mode == 'reset'
                    ? 'Retrouver l’accès\nà ton compte.'
                    : 'Ton portefeuille,\nton compte.',
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const SizedBox(height: 16),
              const Text(
                'Connecte-toi avec Google ou ton adresse e-mail pour enregistrer tes achats et suivre leur performance.',
              ),
              const SizedBox(height: 24),
              if (mode != 'reset') ...[
                OutlinedButton.icon(
                  onPressed: account.busy || !account.googleAvailable
                      ? null
                      : () async {
                          FocusScope.of(context).unfocus();
                          final ok = await account.googleSignIn();
                          if (!context.mounted) return;
                          if (ok) {
                            closeIfReady();
                          } else {
                            final message = account.error ?? account.notice;
                            if (message != null) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(message),
                                  duration: const Duration(seconds: 10),
                                ),
                              );
                            }
                          }
                        },
                  icon: const Icon(Icons.account_circle_outlined),
                  label: const Text('Continuer avec Google'),
                ),
                if (!account.googleAvailable)
                  const Padding(
                    padding: EdgeInsets.only(top: 8),
                    child: Text(
                      'La connexion Google n’est pas encore disponible sur cet appareil. Utilise l’adresse e-mail.',
                      style: TextStyle(fontSize: 12),
                    ),
                  ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 12),
              ],
              AutofillGroup(
                child: Form(
                  key: form,
                  child: Column(
                    children: [
                      TextFormField(
                        controller: email,
                        decoration: const InputDecoration(
                          labelText: 'Adresse e-mail',
                          prefixIcon: Icon(Icons.mail_outline),
                        ),
                        keyboardType: TextInputType.emailAddress,
                        autofillHints: const [AutofillHints.email],
                        autocorrect: false,
                        textInputAction: mode == 'reset'
                            ? TextInputAction.done
                            : TextInputAction.next,
                        enabled: !account.busy,
                        validator: (v) =>
                            v != null &&
                                RegExp(
                                  r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
                                ).hasMatch(v.trim()) &&
                                v.length <= 254
                            ? null
                            : 'Indique une adresse e-mail valide.',
                      ),
                      if (mode != 'reset') ...[
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: password,
                          decoration: InputDecoration(
                            labelText: 'Mot de passe',
                            helperText: mode == 'create'
                                ? 'Au moins 8 caractères. Utilise un mot de passe unique.'
                                : null,
                            prefixIcon: const Icon(Icons.lock_outline),
                            suffixIcon: IconButton(
                              tooltip: obscure
                                  ? 'Afficher le mot de passe'
                                  : 'Masquer le mot de passe',
                              onPressed: () =>
                                  setState(() => obscure = !obscure),
                              icon: Icon(
                                obscure
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                              ),
                            ),
                          ),
                          obscureText: obscure,
                          enableSuggestions: false,
                          autocorrect: false,
                          enabled: !account.busy,
                          autofillHints: [
                            mode == 'create'
                                ? AutofillHints.newPassword
                                : AutofillHints.password,
                          ],
                          validator: (v) => (v ?? '').isEmpty
                              ? 'Indique ton mot de passe.'
                              : mode == 'create' && v!.length < 8
                              ? 'Choisis au moins 8 caractères.'
                              : null,
                        ),
                        if (mode == 'create') ...[
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: confirmation,
                            decoration: const InputDecoration(
                              labelText: 'Confirmer le mot de passe',
                            ),
                            obscureText: true,
                            enableSuggestions: false,
                            autocorrect: false,
                            enabled: !account.busy,
                            validator: (v) => v == password.text
                                ? null
                                : 'Les mots de passe doivent être identiques.',
                          ),
                        ],
                      ],
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: account.busy ? null : submit,
                          child: Text(
                            mode == 'create'
                                ? 'Créer mon compte'
                                : mode == 'reset'
                                ? 'Envoyer le lien'
                                : 'Se connecter',
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (mode == 'login')
                TextButton(
                  onPressed: account.busy ? null : () => changeMode('reset'),
                  child: const Text('Mot de passe oublié ?'),
                ),
              TextButton(
                onPressed: account.busy
                    ? null
                    : () => changeMode(mode == 'login' ? 'create' : 'login'),
                child: Text(
                  mode == 'login'
                      ? 'Créer un compte par e-mail'
                      : 'J’ai déjà un compte',
                ),
              ),
            ],
            if (account.busy) ...[
              const SizedBox(height: 16),
              const LinearProgressIndicator(),
            ],
            const SizedBox(height: 24),
            const Text(
              'Aucun mot de passe n’est conservé par Bourse Facile. La session est protégée par le stockage sécurisé du système.',
              style: TextStyle(fontSize: 12),
            ),
          ],
        ),
      );
    },
  );
}

class AccountPrompt extends StatelessWidget {
  final AccountController account;
  const AccountPrompt(this.account, {super.key});
  @override
  Widget build(BuildContext context) => PageBody(
    children: [
      const Icon(Icons.account_balance_wallet_outlined, size: 56),
      const SizedBox(height: 20),
      Text(
        'Un portefeuille\nqui t’appartient.',
        style: Theme.of(context).textTheme.headlineLarge,
      ),
      const SizedBox(height: 16),
      const Text(
        'Connecte-toi pour ajouter tes actions, renseigner tes prix d’achat et suivre leur évolution. Chaque compte dispose de ses propres achats.',
      ),
      const SizedBox(height: 24),
      FilledButton.icon(
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute<void>(
            builder: (_) => AccountPage(account, closeOnAuthenticated: true),
          ),
        ),
        icon: const Icon(Icons.login),
        label: const Text('Se connecter ou créer un compte'),
      ),
    ],
  );
}
