import 'dart:convert';
import 'package:flutter/services.dart';

class Lesson {
  final String id,
      title,
      subtitle,
      body,
      question,
      takeaway,
      explanation,
      category,
      source;
  final List<String> answers;
  final int correct, minutes;
  Lesson(Map<String, dynamic> j)
    : id = j['id'],
      title = j['title'],
      subtitle = j['subtitle'],
      body = (j['paragraphs'] as List).join('\n\n'),
      question = j['question'],
      takeaway = j['takeaway'],
      explanation = j['explanation'],
      category = j['category'],
      source = j['source'],
      answers = (j['answers'] as List).cast<String>(),
      correct = j['correct'],
      minutes = j['minutes'];
}

List<Lesson> lessons = [];
List<Map<String, dynamic>> glossary = [];
Future<void> loadAcademy() async {
  final j =
      jsonDecode(await rootBundle.loadString('assets/content/academy.json'))
          as Map<String, dynamic>;
  lessons = (j['lessons'] as List)
      .map((l) => Lesson(Map<String, dynamic>.from(l)))
      .toList();
  glossary = (j['glossary'] as List)
      .map((g) => Map<String, dynamic>.from(g))
      .toList();
}
