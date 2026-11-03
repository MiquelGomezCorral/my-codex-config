# React

How to apply `ui.md` in React 19 (the 19.3 post dated 2026-09-09). It adds React mechanics and
never repeats a `ui.md` rule. Check the project's React version before using a rule marked
with one.

- **Compute values during render.** Mirroring a value in state with an Effect adds a render
  and drifts.
- **Read props directly.** Copy a prop into state only to ignore later updates, and name it
  `initial...`; `useState(props.color)` keeps the old color.
- **Run user-triggered logic in event handlers.** Use Effects only to sync with systems
  outside React; an Effect that watches a flag and calls an API runs again on remount.
- **Give each Effect that subscribes, fetches or sets a timer a cleanup.** Late responses
  overwrite newer data, and Strict Mode's extra dev run leaves duplicates.
- **Reset a whole component with a changed `key`**, not an Effect that calls `setState` on a
  prop change.
- **Declare components at module top level.** One declared inside another remounts on every
  render and loses its state.
- **Key list items by a stable id from the data.** Index keys put state on the wrong row when
  a list reorders, inserts or deletes; random keys remount every row.
- **Never mutate props, state or hook arguments**, or a value after it reaches JSX.
- **Fix the dependency list; never silence `react-hooks/exhaustive-deps`.** It hides stale
  closures.
- **Submit with `<form action>` and `useActionState` (React 19).** Hand-built `isSubmitting`
  flags drift from the real request.
- **Call `useFormStatus` in a child rendered inside the `<form>`.** In the component that
  renders the form, `pending` is always `false`.
- **`useOptimistic` reverts on error without telling anyone.** Show the failure message yourself.
- **Take `ref` as a normal prop in new function components (React 19)**, not new `forwardRef`
  wrappers; `forwardRef` is slated for deprecation.
- **`useEffectEvent` (React 19.2) wraps a callback an Effect calls but should not re-run for.**
  Never pass it to a child or list it as a dependency, and never use it just to silence the
  linter.
- **`<ViewTransition>` (stable in React 19.3) animates enter, exit, move and resize.** Only
  updates marked as Transitions animate (`startTransition`, a Suspense reveal,
  `useDeferredValue`); it does not handle reduced motion, so add the media query in CSS.
- **Open a modal with `dialog.showModal()`, not the `open` attribute.** Only `showModal()`
  traps focus, makes the page behind inert and handles Escape.
- **Start independent async calls together with `Promise.all`**, not sequential `await`s.
- **Import from the module that defines a symbol, not a barrel `index` file**, for large
  libraries; measure, because the gain depends on the bundler.
- **Use a ternary when the condition can be `0`.** `{count && <Badge />}` renders the text "0".
- **Use the functional `setState` form when the next value depends on the previous one.**
