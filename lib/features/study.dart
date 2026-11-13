import 'package:flutter/material.dart';
import '../core/accents.dart';
import '../core/store.dart';
import '../data/lessons.dart';
import 'motion.dart';
import 'design.dart';
import 'official.dart';
import 'widgets.dart';

/// Revision uses the same reviewed content as lessons, never market fixtures.
class StudyPage extends StatefulWidget {
  final AppStore store;
  const StudyPage(this.store, {super.key});
  @override
  State<StudyPage> createState() => _StudyPageState();
}

class _StudyPageState extends State<StudyPage> {
  bool quiz = false, revealed = false, checked = false;
  int index = 0;
  int? selected;
  final known = <int>{}, review = <int>{};
  void reset() {
    revealed = false;
    checked = false;
    selected = null;
  }

  void move(int delta) => setState(() {
    index += delta;
    reset();
  });
  @override
  Widget build(BuildContext context) {
    final length = quiz ? lessons.length : glossary.length;
    return Scaffold(
      appBar: AppBar(title: const Text('Quiz & flashcards')),
      body: PageBody(
        children: [
          const PageHeading(
            'Une notion à la fois.',
            'Révise, vérifie et comprends ta réponse.',
          ),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final mode in [false, true])
                ChoiceChip(
                  label: Text(mode ? 'Quiz' : 'Flashcards'),
                  selected: quiz == mode,
                  selectedColor: Accents.surface(
                    context,
                    mode ? AccentTone.yellow : AccentTone.blue,
                  ),
                  onSelected: (_) => setState(() {
                    quiz = mode;
                    index = 0;
                    reset();
                  }),
                ),
            ],
          ),
          const SizedBox(height: 20),
          if (length == 0)
            const Text('Le contenu pédagogique est indisponible.')
          else ...[
            Text(
              '${quiz ? 'Question' : 'Carte'} ${index + 1} / $length',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(
              value: (index + 1) / length,
              semanticsLabel: 'Position dans la série',
            ),
            const SizedBox(height: 20),
            if (!quiz) ...[
              Card(
                color: Accents.surface(
                  context,
                  revealed ? AccentTone.yellow : AccentTone.blue,
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const FriendlyIcon(FriendlySymbol.book, size: 52),
                      const SizedBox(height: 16),
                      Text(
                        glossary[index]['term'] as String,
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 12),
                      if (!revealed)
                        const Text('Comment expliquerais-tu cette notion ?')
                      else
                        FriendlyReveal(
                          child: Semantics(
                            liveRegion: true,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  glossary[index]['definition'] as String,
                                  style: Theme.of(context).textTheme.bodyLarge,
                                ),
                                if ((glossary[index]['formula'] as String? ??
                                        '')
                                    .isNotEmpty) ...[
                                  const SizedBox(height: 16),
                                  Text(
                                    glossary[index]['formula'] as String,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 16),
                                SourceButton(
                                  'Référence BRVM',
                                  glossary[index]['source'] as String,
                                ),
                              ],
                            ),
                          ),
                        ),
                      const SizedBox(height: 20),
                      OutlinedButton.icon(
                        onPressed: () => setState(() => revealed = !revealed),
                        icon: Icon(
                          revealed ? Icons.visibility_off_outlined : Icons.flip,
                        ),
                        label: Text(
                          revealed
                              ? 'Masquer la réponse'
                              : 'Retourner la carte',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (revealed)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    OutlinedButton(
                      onPressed: () => setState(() {
                        review.add(index);
                        known.remove(index);
                      }),
                      child: const Text('À revoir'),
                    ),
                    FilledButton(
                      onPressed: () => setState(() {
                        known.add(index);
                        review.remove(index);
                      }),
                      child: const Text('Je sais expliquer'),
                    ),
                  ],
                ),
              const SizedBox(height: 12),
              Text(
                '${known.length} comprises · ${review.length} à revoir',
                semanticsLabel:
                    '${known.length} cartes comprises, ${review.length} à revoir',
              ),
              const Text(
                'Auto-évaluation de cette session. Retourner une carte ne valide pas une leçon.',
                style: TextStyle(fontSize: 12),
              ),
            ] else ...[
              Text(
                lessons[index].category,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 8),
              Text(
                lessons[index].question,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              RadioGroup<int>(
                groupValue: selected,
                onChanged: (value) {
                  if (!checked) setState(() => selected = value);
                },
                child: Column(
                  children: [
                    for (var i = 0; i < lessons[index].answers.length; i++)
                      Card(
                        child: RadioListTile<int>(
                          value: i,
                          title: Text(lessons[index].answers[i]),
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
                        final lessonIndex = index;
                        final correct =
                            selected == lessons[lessonIndex].correct;
                        setState(() => checked = true);
                        if (correct) await widget.store.complete(lessonIndex);
                      },
                child: const Text('Vérifier ma réponse'),
              ),
              if (checked)
                FriendlyReveal(
                  success: selected == lessons[index].correct,
                  child: Card(
                    color: Accents.surface(context, AccentTone.yellow),
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Semantics(
                        liveRegion: true,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            FriendlyIcon(
                              selected == lessons[index].correct
                                  ? FriendlySymbol.reward
                                  : FriendlySymbol.book,
                            ),
                            Text(
                              selected == lessons[index].correct
                                  ? 'Bien compris. Leçon validée !'
                                  : 'On révise ensemble.',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 10),
                            Text(
                              'Bonne réponse : ${lessons[index].answers[lessons[index].correct]}',
                            ),
                            const SizedBox(height: 10),
                            Text(lessons[index].explanation),
                            SourceButton(
                              'Référence BRVM',
                              lessons[index].source,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
            ],
            const SizedBox(height: 24),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              children: [
                OutlinedButton.icon(
                  onPressed: index > 0 ? () => move(-1) : null,
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Précédente'),
                ),
                FilledButton.icon(
                  onPressed: index < length - 1 ? () => move(1) : null,
                  icon: const Icon(Icons.arrow_forward),
                  label: const Text('Suivante'),
                ),
              ],
            ),
          ],
          const SizedBox(height: 20),
          const Text(
            'Contenu pédagogique Bourse Facile · références BRVM. Ces exercices ne sont pas une certification de la BRVM.',
            style: TextStyle(fontSize: 12),
          ),
        ],
      ),
    );
  }
}
