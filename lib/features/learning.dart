import 'package:flutter/material.dart';
import '../core/store.dart';
import '../core/theme.dart';
import '../data/lessons.dart';
import 'widgets.dart';
import 'design.dart';
import '../core/accents.dart';
import 'motion.dart';
import 'package:flutter/services.dart';
import 'official.dart';
import 'study.dart';

class LearningPage extends StatefulWidget {
  final AppStore store;
  const LearningPage(this.store, {super.key});
  @override
  State<LearningPage> createState() => _LearningPageState();
}

class _LearningPageState extends State<LearningPage> {
  String category = 'Tous';
  @override
  Widget build(BuildContext context) => PageBody(
    children: [
      const PageHeading(
        'Apprendre à investir.',
        'Des leçons concrètes et des quiz expliqués, à ton rythme.',
      ),
      ProgressSummary(
        completed: widget.store.completed.length,
        total: lessons.length,
        title: 'Ton parcours, pas à pas.',
      ),
      const SizedBox(height: 20),
      Card(
        color: Accents.surface(context, AccentTone.blue),
        child: ListTile(
          contentPadding: const EdgeInsets.all(20),
          leading: const FriendlyIcon(FriendlySymbol.book, size: 48),
          title: const Text(
            'Quiz & flashcards',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
          subtitle: Text(
            '${glossary.length} cartes à retourner · ${lessons.length} quiz expliqués',
          ),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute<void>(builder: (_) => StudyPage(widget.store)),
          ),
        ),
      ),
      const SizedBox(height: 20),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final c in ['Tous', ...lessons.map((l) => l.category).toSet()])
            ChoiceChip(
              label: Text(c),
              selectedColor: Accents.surface(context, switch (c) {
                'Analyser' => AccentTone.brown,
                'Simuler' => AccentTone.pink,
                'Premier investissement' => AccentTone.yellow,
                _ => AccentTone.blue,
              }),
              selected: category == c,
              onSelected: (_) => setState(() => category = c),
            ),
        ],
      ),
      const SizedBox(height: 20),
      for (var i = 0; i < lessons.length; i++)
        if (category == 'Tous' || lessons[i].category == category)
          Card(
            margin: const EdgeInsets.only(bottom: 14),
            child: ListTile(
              contentPadding: const EdgeInsets.all(20),
              leading: CircleAvatar(
                backgroundColor: widget.store.completed.contains(i)
                    ? Brand.lime
                    : Theme.of(context).colorScheme.surfaceContainerHighest,
                child: widget.store.completed.contains(i)
                    ? const Icon(Icons.check, color: Brand.ink)
                    : Text('${i + 1}'),
              ),
              title: Text(
                lessons[i].title,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              subtitle: Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  '${lessons[i].category} · ${lessons[i].minutes} min · Quiz\n${lessons[i].subtitle}',
                ),
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute<void>(
                  builder: (_) => LessonPage(i, widget.store),
                ),
              ),
            ),
          ),
      OutlinedButton.icon(
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute<void>(builder: (_) => const GlossaryPage()),
        ),
        icon: const Icon(Icons.menu_book),
        label: Text('Le lexique · ${glossary.length} notions'),
      ),
      const SizedBox(height: 20),
      const Text(
        'Rédaction pédagogique : Bourse Facile. Relecture : 11 novembre 2026. Les définitions et quiz ne sont pas des publications officielles de la BRVM. Les sources de référence sont accessibles dans les leçons.',
        style: TextStyle(fontSize: 12),
      ),
    ],
  );
}

class LessonPage extends StatefulWidget {
  final int index;
  final AppStore store;
  const LessonPage(this.index, this.store, {super.key});
  @override
  State<LessonPage> createState() => _LessonPageState();
}

class _LessonPageState extends State<LessonPage> {
  int? selected;
  bool checked = false;
  @override
  Widget build(BuildContext context) {
    final l = lessons[widget.index];
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.index + 1} / ${lessons.length} · ${l.category}'),
      ),
      body: PageBody(
        children: [
          Text(l.title, style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: 10),
          Text('${l.minutes} min · Lecture & mise en pratique'),
          const SizedBox(height: 24),
          SelectableText(l.body, style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: 24),
          LimePanel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'À RETENIR',
                  style: TextStyle(
                    letterSpacing: 1,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  l.takeaway,
                  style: const TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SectionTitle('À toi de jouer'),
          Text(l.question, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 14),
          RadioGroup<int>(
            groupValue: selected,
            onChanged: checked ? (_) {} : (v) => setState(() => selected = v),
            child: Column(
              children: [
                for (var i = 0; i < l.answers.length; i++)
                  Card(
                    margin: const EdgeInsets.only(bottom: 10),
                    child: RadioListTile<int>(
                      value: i,
                      title: Text(l.answers[i]),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: selected == null || checked
                ? null
                : () async {
                    final reduceMotion = MediaQuery.disableAnimationsOf(
                      context,
                    );
                    setState(() => checked = true);
                    if (selected == l.correct) {
                      await widget.store.complete(widget.index);
                      if (mounted && !reduceMotion) {
                        try {
                          await HapticFeedback.selectionClick();
                        } catch (_) {}
                      }
                    }
                  },
            child: const Text('Vérifier ma réponse'),
          ),
          if (checked) ...[
            const SizedBox(height: 20),
            FriendlyReveal(
              success: selected == l.correct,
              child: Semantics(
                liveRegion: true,
                child: Card(
                  color: Accents.surface(
                    context,
                    selected == l.correct ? AccentTone.yellow : AccentTone.blue,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            FriendlyIcon(
                              selected == l.correct
                                  ? FriendlySymbol.reward
                                  : FriendlySymbol.book,
                              size: 40,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                selected == l.correct
                                    ? 'Bien compris. Leçon validée !'
                                    : 'Reprenons le raisonnement.',
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(l.explanation),
                        if (selected != l.correct)
                          TextButton(
                            onPressed: () => setState(() {
                              checked = false;
                              selected = null;
                            }),
                            child: const Text('Réessayer'),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
          const SizedBox(height: 20),
          SourceButton('Référence officielle · BRVM', l.source),
          if (widget.index + 1 < lessons.length)
            TextButton.icon(
              onPressed: () => Navigator.pushReplacement(
                context,
                MaterialPageRoute<void>(
                  builder: (_) => LessonPage(widget.index + 1, widget.store),
                ),
              ),
              icon: const Icon(Icons.arrow_forward),
              label: const Text('Leçon suivante'),
            ),
        ],
      ),
    );
  }
}

class GlossaryPage extends StatefulWidget {
  const GlossaryPage({super.key});
  @override
  State<GlossaryPage> createState() => _GlossaryPageState();
}

class _GlossaryPageState extends State<GlossaryPage> {
  String query = '';
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Le lexique')),
    body: PageBody(
      children: [
        TextField(
          decoration: const InputDecoration(
            labelText: 'BPA, PER, dividende…',
            prefixIcon: Icon(Icons.search),
          ),
          onChanged: (v) => setState(() => query = v.toLowerCase()),
        ),
        const SizedBox(height: 20),
        for (final t in glossary.where(
          (t) =>
              ("${t['term']} ${t['definition']}").toLowerCase().contains(query),
        ))
          Card(
            margin: const EdgeInsets.only(bottom: 14),
            child: ExpansionTile(
              expandedCrossAxisAlignment: CrossAxisAlignment.start,
              tilePadding: const EdgeInsets.all(18),
              childrenPadding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
              title: Text(
                t['term'],
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Text(t['category']),
              children: [
                Text(t['definition']),
                if (t['formula'] != null) ...[
                  const SizedBox(height: 14),
                  SelectableText(
                    t['formula'],
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ],
                SourceButton('Source de référence BRVM', t['source']),
              ],
            ),
          ),
      ],
    ),
  );
}
