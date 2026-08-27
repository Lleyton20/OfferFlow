export interface BankQuestion {
  category: 'Behavioral' | 'Situational' | 'Culture Fit' | 'Technical Fundamentals'
  question: string
  tip: string
}

export const QUESTION_BANK: BankQuestion[] = [
  {
    category: 'Behavioral',
    question: 'Tell me about a time you failed at something. What did you learn?',
    tip: 'Own the failure honestly (Situation/Task), then spend most of the answer on Action/Result — what you changed.',
  },
  {
    category: 'Behavioral',
    question: 'Describe a conflict you had with a teammate and how you resolved it.',
    tip: "Focus on the resolution process, not who was \"right\" — show you can de-escalate.",
  },
  {
    category: 'Behavioral',
    question: 'Tell me about a time you had to learn something new quickly.',
    tip: 'Name the specific resource/strategy you used to learn fast, not just "I studied hard."',
  },
  {
    category: 'Behavioral',
    question: 'Describe a project you\'re most proud of.',
    tip: 'Pick something with a measurable result, and be ready for deep follow-up questions on it.',
  },
  {
    category: 'Behavioral',
    question: 'Tell me about a time you disagreed with a decision made by your team or manager.',
    tip: 'Show you can push back respectfully and still commit once a decision is made.',
  },
  {
    category: 'Behavioral',
    question: 'Describe a time you had to juggle multiple deadlines.',
    tip: 'Talk through your prioritization method, not just that you "worked hard."',
  },
  {
    category: 'Behavioral',
    question: 'Tell me about a time you received critical feedback. How did you respond?',
    tip: 'Show genuine reflection — what specifically changed in how you work afterward.',
  },
  {
    category: 'Situational',
    question: 'How would you handle a teammate who consistently misses deadlines?',
    tip: 'Lead with a direct, private conversation before escalating — show emotional intelligence.',
  },
  {
    category: 'Situational',
    question: 'What would you do if you disagreed with your manager on a technical approach?',
    tip: 'Present data/reasoning, propose a small test if possible, and defer gracefully if overruled.',
  },
  {
    category: 'Situational',
    question: 'How would you prioritize if given three urgent tasks with the same deadline?',
    tip: 'Mention clarifying impact/dependencies with stakeholders before just picking one.',
  },
  {
    category: 'Culture Fit',
    question: 'Why do you want to work here specifically?',
    tip: 'Reference something concrete about the product, team, or mission — not generic praise.',
  },
  {
    category: 'Culture Fit',
    question: 'What kind of environment do you do your best work in?',
    tip: "Be honest, but tie it back to something the company's culture actually offers.",
  },
  {
    category: 'Culture Fit',
    question: 'Where do you see yourself in 3-5 years?',
    tip: "Show ambition that's compatible with growth paths at this company/role.",
  },
  {
    category: 'Technical Fundamentals',
    question: 'Walk me through how you would design a rate limiter.',
    tip: 'Clarify requirements first (scale, accuracy vs. cost), then discuss algorithm tradeoffs (token bucket vs. sliding window).',
  },
  {
    category: 'Technical Fundamentals',
    question: 'What happens when you type a URL into a browser and hit enter?',
    tip: 'Structure it: DNS → TCP/TLS handshake → HTTP request → server processing → render. Depth over speed.',
  },
  {
    category: 'Technical Fundamentals',
    question: 'How would you debug a production issue you have never seen before?',
    tip: 'Talk through a systematic process: reproduce, check logs/metrics, isolate scope, form hypotheses.',
  },
  {
    category: 'Technical Fundamentals',
    question: 'Explain the tradeoffs between SQL and NoSQL databases.',
    tip: 'Anchor on consistency, schema flexibility, and query patterns rather than reciting definitions.',
  },
]
