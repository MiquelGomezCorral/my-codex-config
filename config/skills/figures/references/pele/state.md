# State

Use for: States of one thing and the transitions between them, with composite states.

Keyword: `stateDiagram-v2`

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Submitted : submit
  state Review {
    [*] --> Screening
    Screening --> Decision
  }
  Submitted --> Review
  Review --> Published : approved
  Review --> Draft : rejected
  Published --> [*]
```

```mermaid
stateDiagram-v2
    [*] --> Active

    state Active {
        [*] --> NumLockOff
        NumLockOff --> NumLockOn : EvNumLockPressed
        NumLockOn --> NumLockOff : EvNumLockPressed
        --
        [*] --> CapsLockOff
        CapsLockOff --> CapsLockOn : EvCapsLockPressed
        CapsLockOn --> CapsLockOff : EvCapsLockPressed
        --
        [*] --> ScrollLockOff
        ScrollLockOff --> ScrollLockOn : EvScrollLockPressed
        ScrollLockOn --> ScrollLockOff : EvScrollLockPressed
    }
```

Composite state:

```mermaid
stateDiagram-v2
  [*] --> Active
  state Active {
    [*] --> Typing
    Typing --> Waiting : pause
    Waiting --> Typing : key
  }
  Active --> Saved : save
  Saved --> Active : edit
  Saved --> [*]
```

Source: pele.run examples (MIT), Pele 1.6.0. Full gallery: [State examples](https://pele.run/examples/state).
