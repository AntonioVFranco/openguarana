export type DecisionEvent =
  | { type: 'DecisionRecorded'
      id:        string
      what:      string
      why:       string
      tradeoffs: string[]
      who:       string
      at:        string }

  | { type: 'OutcomeRecorded'
      decisionId: string
      outcome:    string
      rating:     1 | 2 | 3 | 4 | 5
      at:         string }

  | { type: 'DecisionLinked'
      fromId:   string
      toId:     string
      relation: 'supersedes' | 'depends_on' | 'conflicts_with'
      at:       string }

  | { type: 'DecisionSuperseded'
      oldId:  string
      newId:  string
      reason: string
      at:     string }
