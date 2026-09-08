@AGENTS.md

# Coding rules — Clean Code principles

Apply these principles to all code you write or modify. When a choice is ambiguous, prefer readability over cleverness.

## Naming
- A name says what the thing does or holds, with no comment needed: `elapsedDays`, not `d`.
- Pronounceable, searchable, no type encoding or Hungarian prefixes.
- Verbs for functions (`fetchUser`, `isValid`), nouns for classes and variables.
- One concept = one word, everywhere: don't mix `get`/`fetch`/`retrieve` for the same idea.
- No magic numbers or strings: use a named constant.

## Functions
- Small. A function does one thing, at one level of abstraction.
- Ideally 0 to 2 arguments; beyond that, group them in an object. Never a boolean flag parameter (that's two functions).
- No hidden side effects: a function named `checkPassword` must not also initialize a session.
- Separate commands (change state) from queries (return a value).
- Avoid duplication: if you copy-paste, extract.
- Read top to bottom: called functions are defined right after the functions that call them.

## Comments
- Code should explain itself; a comment compensates for a failure to express. Before writing one, try renaming or extracting.
- Useful comments: non-obvious intent, warning of consequences, justification of a choice, dated TODO.
- Forbidden: redundant comments, commented-out code (delete it, git remembers), change logs, noise.

## Formatting
- Short files, ordered from high level to detail.
- Related lines vertically close; unrelated concepts separated by a blank line.
- Follow the project's formatter/linter without debate.

## Objects and data structures
- Hide internals: expose behavior, not getters/setters on every field.
- Law of Demeter: don't chain calls into an object's guts (`a.getB().getC().doX()`).
- Distinguish objects (behavior, hidden data) from data structures (exposed data, no logic).

## Error handling
- Exceptions over return codes; never return or pass `null` when a type or an empty value will do.
- Context in the error message: what, where, why.
- Never swallow an exception silently. An empty `catch` is a bug.
- Error handling must not obscure business logic: isolate it in its own function.

## Boundaries and dependencies
- Wrap third-party APIs behind our own interface; don't let an external SDK leak throughout the codebase.
- Write learning tests when discovering a library.

## Tests
- One test = one concept, one logical assertion. Readable as a spec.
- F.I.R.S.T.: fast, independent, repeatable, self-validating, timely.
- Test code deserves the same care as production code.
- TDD when relevant: red test → minimal code → refactor.

## Classes and modules
- Small, single responsibility (SRP), one reason to change.
- High cohesion: if a group of methods only uses part of the fields, that's another class.
- Depend on abstractions, not concretions (DIP); inject dependencies.

## Systems
- Separate construction (wiring, config, DI) from use.
- Don't over-architect: the simplest structure that works, evolve it later.

## Emergence (in this priority order)
1. All tests pass.
2. No duplication.
3. Expresses the author's intent.
4. Minimizes the number of classes and methods.

## Concurrency
- Isolate concurrent code, limit the scope of shared data, prefer copies and immutability.
- Test under varied conditions; concurrency bugs are not "flukes".

## Refactoring and hygiene
- Boy scout rule: leave every file you touch a bit cleaner than you found it, without changing behavior outside the scope.
- Refactor in small steps, tests green between each.

## Smells to flag and fix
- Long functions, long argument lists, flags, dead code, duplication, stale comments, repeated `switch` statements (→ polymorphism), unexplained variables, hidden temporal coupling, magic numbers, negative conditionals, misplaced responsibilities.

## Expected behavior from Claude Code
- Before coding: read the surrounding existing code, respect its conventions.
- After coding: reread, look for the smells above, run lint and tests.
- If a request pushes toward dirty code (hack, duplication), say so and propose the clean alternative — then do what the user decides.