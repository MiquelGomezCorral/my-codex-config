# Python Project Setup

Follow the repository first. Use these defaults only when creating or maintaining a
project based on the MiquelGomezCorral template. 

The base structure comes from the [MiquelGomezCorral template](https://github.com/MiquelGomezCorral/Python-project-template-AI-TL) and the [maikol-utils](https://github.com/MiquelGomezCorral/maikol-utils).

Golden rule: KISS! Keep it simple, stupid. The goal is to write simple readible code that works and is easy to maintain. 

## Environment

- Use one conda environment per project; default to Python 3.13 for a new template.
- Use `uv pip` for dependency installation inside that environment.
- Treat `requirements.txt` as the dependency source unless packaging for distribution.
- Install the project editable with `pip install -e .` so imports resolve without path
hacks.
- Register a project-specific Jupyter kernel only when notebooks need it.
- Respect existing lock, requirements, and project metadata; never mix package managers.
- Never commit `.env`; commit only `example.env` with placeholder values.

```
conda create --name myenv python=3.13 -y
conda activate myenv

# pip install uv
uv pip install -r requirements.txt

uv pip install ipykernel
python -m ipykernel install --user --name=myenv --display-name "Python (Conda)"
```

## Layout

```text
pyproject.toml
requirements.txt
app/
  src/
    config/
      __init__.py
      config.py
    data/
      __init__.py
    models/
      __init__.py
    utils/
      __init__.py
    ...
  scripts/
config/
data/
notebooks/
```

`app/` is both the source folder and editable package. Preserve this package discovery:

```toml
# ======================================================================================
#                                       PROJECT
# ======================================================================================
[project]
name = "app"
version = "0.1.0"
description = "Project description"
readme = "README.md"
requires-python = ">=3.13"
dynamic = ["dependencies"]

[tool.setuptools.dynamic]
dependencies = {file = ["requirements.txt"]}

[build-system]
requires = ["setuptools"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
where = ["app"]
include = ["src*", "scripts*"]

[tool.pyright]
include = ["app"]
exclude = ["data/**", "logs/**", "models/**"]
extraPaths = ["app"]
typeCheckingMode = "off"
```

Use `from src.module import ...` for `app/src/module.py`, relative imports within a
package, and absolute imports across packages. Subpackages need `__init__.py`. Do not
modify `sys.path` or depend on the working directory.

Keep configuration standalone and expose one `Configuration` instance as `CONFIG`.
Use `Path` for repository paths and keep user-adjustable paths and parameters
in that project-owned configuration.

## Workflow

1. Inspect the repository, environment files, lockfiles, and documented commands.
2. Create or activate the intended conda environment.
3. Install dependencies with the repository's chosen input and `uv pip`.
4. Install editable and verify one real package import.
5. Run the narrowest relevant tests or a representative processing dry run.

For refactoring, preserve behavior, derive types and configuration from authoritative
sources, remove obsolete paths, and verify imports plus the affected real flow.

## Imports and notebooks

Given the current setup, all python files that use this env will import from the .app/ folder. Therefore, all must use schemas like `from scripts import ...` or `from src.config import Configuration` or `from src.data import ...`.

- data, config and any other folder inside .app/ are considered packages and must have an `__init__.py` file.
- All files within a package that import from the same package, must do if with the patterns \`from .file\_name import ...'.
- All files within a package that import from another package must do so with `from src.package_name import ...`
- Scripts folder are considered packages and must have an `__init__.py` file. They can only be imported from main.py or from other scripts. They cannot be imported from src or any other package.
- config.py must never import from any other package. It is the only file that can be imported from anywhere without restrictions. We can define other files at src/config and import them from config.py, but those cannot import from any other package. This is to avoid circular imports and to have a single source of truth for configuration.
- Notebooks need no weird sys.path hacks since this setup works for them as well.
- All imports go at the top of the file. Never import inside a function, method, or class, and never use
  `importlib.import_module` or `__import__` to dodge that. Needing a lazy import means the package
  structure is wrong (a circular import, or a light module importing a heavy one): fix the dependency
  direction by moving the shared code down or splitting the module. Only the user can approve an exception.
- Add the `python -m ipykernel install --user --name=venv --display-name "Python (venv)"` to make the env work for notebooks.

### __init__.py file
Things like the follwing must be avoided to avoid extra complicated files. This file must remain only the import of each package desired 'functions' and 'variable' to be used by other parts of the app, nothing else, not slop nor blop code.

THIS IS WRONG:
```python
"""Public ARM-FM reconstruction interfaces."""

from importlib import import_module

from .artifacts import ArtifactBundle, BundleManifest, BundleValidationError, load_bundle
from .environments import labeling_api_for_domain, make_environment
from .evaluation import (
    ...
    load_qwen_embedding_model,
    resolve_embedding_settings,
)
from .generation import adapt_compilation_result, generate_baseline_bundle, generate_compiler_bundle
from .runtime import (
    PaperRewardMachine,
    ...
    serialize_reward_machine,
)

_TRAINING_EXPORTS = {
    "ALGORITHM_COMPONENTS",
    "BuiltinPolicy",
    "ExperimentManifest",
    "RNDModule",
    "TaskManifestEntry",
    "TrainingCheckpoint",
    "TrainingConfig",
    "algorithm_for_domain",
    "load_builtin_policy",
    "load_task_manifest",
    "paper_experiment_manifest",
    "paper_training_config",
    "train_larm",
    "train_manifest",
}


def __getattr__(name: str):
    """Load training symbols only when a training command requests them."""
    if name not in _TRAINING_EXPORTS:
        raise AttributeError(name)
    value = getattr(import_module(".training", __name__), name)
    globals()[name] = value
    return value

__all__ = [
    "ArtifactBundle",
    "BundleManifest",
    "BundleValidationError",
    "PaperRewardMachine",
    "RewardMachineEnvironment",
    "RewardMachineRuntime",
    "RuntimeRewardMachine",
    "RuntimeStep",
    "RuntimeTransition",
    "RuntimeValidationError",
    "load_labeling_functions",
    "parse_paper_reward_machine",
    "parse_reward_machine",
    "serialize_paper_reward_machine",
    "serialize_reward_machine",
    "load_bundle",
    "labeling_api_for_domain",
    "make_environment",
    "EMBEDDING_MODEL",
    "EmbeddingCache",
    "EmbeddingSettings",
    "JudgeDecision",
    "JudgeSettings",
    "aggregate_judgments",
    "embed_state_descriptions",
    "frozen_evaluate",
    "judge_bundle",
    "load_qwen_embedding_model",
    "resolve_embedding_settings",
    "generate_baseline_bundle",
    "generate_compiler_bundle",
    "adapt_compilation_result",
    *sorted(_TRAINING_EXPORTS),
]
```

THIS IS RIGHT:
```python
"""Public ARM-FM reconstruction interfaces."""

from .artifacts import ArtifactBundle, BundleManifest, BundleValidationError, load_bundle
from .environments import labeling_api_for_domain, make_environment
from .evaluation import (
    ...
    load_qwen_embedding_model,
    resolve_embedding_settings,
)
from .generation import adapt_compilation_result, generate_baseline_bundle, generate_compiler_bundle
from .runtime import (
    PaperRewardMachine,
    ...
    serialize_reward_machine,
)
```

Same result, same import capabilities, just cleaner simpler and better
Same for This
```python
from .generate_rm import generate_rm

__all__ = ["GenerationHooks", "generate_rm"]

```

and then
```python
from scripts import arm_fm
...
    return arm_fm.generate_larm(args_to_dataclass(args, Configuration))
```
that is so wrong, if you want to use a function, IMPORT IT! not the whole file. 



## Environment variables

- Use `.env` for local environment variables and `example.env` for placeholders.
- Use `dotenv` to load the `.env` file in main.py and any other script that needs it.
- Do not rely on bash environment variables for scripts or notebooks.

Some features such as engines and other classes must load their oun API\_KEYs, URLs, secrets, etc. instead of prop-drilling them or using the config. The 'selected model' or 'selected engine' can be stored in the config, but the API\_KEYs and other secrets must be loaded from the .env file or from the environment variables.

Same rule applies for other things. Load dotenv in main.py and the actual ENV variables in the classes that need them. 

## Comment separator

Use 

```
# ======================================================================================
#                                       SECTION NAME
# ======================================================================================
```

To separate sections of code. This is to make the code more readable and to have a clear separation of different parts of the code. 

- You must not over do it
- You can use shorter versions of it or just the # ========= Section Name ========= if the section is small and does not need a full separator.
- Do not use it in every single section, only when necessary. 
- Try to group or even combine sections. If hierarchy is clear, you can use different levels of separators. For example, if you have a section that is a subsection of another section, you can use a shorter separator for the subsection.

## Docstrings

Most functions need no docstring: a clear name and type hints say enough. Add one only when
the purpose, inputs, or output are not obvious from the signature, such as public entry
points, non-trivial algorithms, or functions with constraints the caller must know. When
you write one, use this shape (Google style, which the lint config checks):

```python
def select_actions(observations: np.ndarray, temperature: float) -> np.ndarray:
    """Sample one action per environment from the policy.

    Optional extra lines: constraints, side effects, or why it works this way.

    Args:
        observations (np.ndarray): Batch of observations, shape (n_envs, obs_dim).
        temperature (float): Softmax temperature; higher means more exploration.

    Returns:
        np.ndarray: Chosen action index per environment, shape (n_envs,).
    """
```

## Smart spaces

When writing code, use and add space between lines of code. Group them on chucks of at most 5-10 lines of code. This is to make the code more readable and to have a clear separation of different parts of the code.

- Let de code breathe. 
- Use the comments of the last sections to help you group the code in a logical way.
- Inside a function the formatter keeps at most one blank line. For a bigger break, use one blank line plus a short `# == Step ==` comment.
- Spaces can be used as separators.

## Spaghetti code and overcomplication

- Avoid spaghetti code.
- Use functions and classes to organize the code.
- Refactor into other files, group utils and helpers into their own files and packages.
- If you are using too many utils or need to refactor too much, first think if you are overcomplicating the code. If you are, try to simplify it first. Recall KISS!
- If you are not, then refactor it into other files and packages. But do not overcomplicate the code just to avoid spaghetti code.

Most of the time, since you are and IA, you will write greedly and overcomplicate the code, avoid it:

- Don't repeat yourself: Add abstractions only after real duplication
- Keep implementation near usage
- Centralize policy, not everything
- Add abstractions only after real duplication: No interfaces, factories, or configuration layers for hypothetical future requirements. No retro-compatibility for unused legacy. No overgeneralization for unneeded flexibility. No premature optimization.
- Keep classes narrow: Classes coordinate state and behavior. Parsing, schemas, and error mapping stay in focused modules.
- Make invalid architecture detectable: Tests should enforce boundaries rather than relying on us remembering them.
- Preserve intentional readability: Section dividers, meaningful semantic classes, and concise names are part of the project style.
- ... ALL YOUR CODING GUIDELINES ...

## Test

The idea is that we don't write almost any test. Too many tests will make the code not maintainable.

- We are only going to test algorithms and things that must be deterministic.
- We don't test AI models outputs: we test that the return the expected type or structure or schema, not values.
- We don't test things that are trivial.
- We don't test all the inputs 
- We don't validate everything, only what really matters

### Example
- We dont test imports, this makes no sense -> we assume all imports work at all time. 
  - Only exception is when you have 'complex' imports such as Gymnasium envs that you don't expect. But this is only if you have a lot of 'non-related' envs or dependencies that may not be compatible between, that are out of scope and very justified. Normal imports such as libaries ALWAYS!
```python
 try:
        import torch
    except ImportError as error:
        raise RuntimeError("Embedding requires torch; no model download is performed") from error
   
```
- ...

## Checks

Every project carries its own checks: the lint block in `pyproject.toml` plus
`.pre-commit-config.yaml`. If a project has neither, say so instead of adding them unasked.
`code-quality` owns when to run them and how to handle failures; this section owns the
Python commands.

- Fix mode (the agent that edits): `pre-commit run --files <changed files>`
- Read-only mode (cleanup and review): `ruff check --no-fix --no-cache --output-format concise
  <changed files>`, `ruff format --check --no-cache <changed files>`, and
  `lint-imports --no-cache`

Run `pre-commit install` once per clone so commits run the same checks.

Adding checks to an existing repository is its own task: add the config, exclude vendored
code and submodules in `extend-exclude`, run `pre-commit run --all-files` once, and commit
that before other work so later diffs stay readable. Then run the repository's tests: the
`F401` fix deletes imports kept only for their side effects (such as environment
registration); list those in `[tool.ruff.lint.pyflakes] allowed-unused-imports`. The
`gitleaks` hook scans staged files only, so scan history once with `gitleaks git .`.
Report the errors left for manual fixing to the user instead of fixing them inside an
unrelated task.

`lint-imports` always checks the whole repository. A broken contract outside the task's
files is pre-existing: report it, do not fix it inside that task.

### Approved skips

Only after the user approves the skip, use the narrowest one and write the reason:

- One line, or a whole function from its `def` line: `# noqa: PLR0913  approved: <reason>`
- A block: `# ruff: disable[CODE]` ... `# ruff: enable[CODE]`
- A file: `# ruff: noqa: CODE` at the top
- import-linter and the local pygrep hooks cannot be skipped inline: use the contract's
  `ignore_imports` or the hook's `exclude`.

`RUF100` flags a `noqa` that no longer matches an error.

### pyproject.toml

Append after the project block. Adjust the import-linter contracts to the project's
packages: `config` imports no other project package, and `src` never imports `scripts`.

```toml
# ======================================================================================
#                                    LINT AND CHECKS
# ======================================================================================
[tool.ruff]
line-length = 100
src = ["app"]
extend-exclude = [".agents", "*.md"]

[tool.ruff.lint]
select = [
    "E", "W", "F", "I", "N", "UP", "B", "C4", "SIM", "RET", "PIE", "PTH",
    "TID", "S", "D", "C90", "PLR0913", "PLC0415", "ARG", "NPY", "T10", "RUF",
]
ignore = ["E501", "D1", "S101", "S311"]

[tool.ruff.lint.per-file-ignores]
"__init__.py" = ["F401"]
"**/tests/**" = ["D", "ARG", "S"]
"**/test_*.py" = ["D", "ARG", "S"]
"*.ipynb" = ["D", "E402", "F811"]

[tool.ruff.lint.pydocstyle]
convention = "google"

[tool.ruff.lint.mccabe]
max-complexity = 10

[tool.ruff.lint.pylint]
max-args = 5

[tool.ruff.lint.pep8-naming]
extend-ignore-names = ["*CONFIG", "visit_*"]

[tool.ruff.lint.flake8-tidy-imports]
ban-relative-imports = "parents"

[tool.ruff.lint.flake8-tidy-imports.banned-api]
"sys.path".msg = "No sys.path hacks; the editable install resolves imports."
"importlib.import_module".msg = "No dynamic imports; import at the top of the file."

[tool.importlinter]
root_packages = ["src", "scripts"]

[[tool.importlinter.contracts]]
name = "src never imports scripts"
type = "forbidden"
source_modules = ["src"]
forbidden_modules = ["scripts"]

[[tool.importlinter.contracts]]
name = "config imports no project package"
type = "forbidden"
source_modules = ["src.config"]
forbidden_modules = ["src.data", "src.models", "src.utils", "scripts"]
```

### .pre-commit-config.yaml

The read-only mode and `import-linter` run from the project environment, so
`requirements.txt` lists `pre-commit`, `ruff`, and `import-linter`.

```yaml
exclude: ^\.agents/

repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v6.0.0
    hooks:
      - id: check-added-large-files
        args: [--maxkb=1024]
      - id: check-json
      - id: check-toml
      - id: check-yaml
      - id: check-merge-conflict
      - id: check-shebang-scripts-are-executable
      - id: end-of-file-fixer
      - id: mixed-line-ending
      - id: trailing-whitespace
        args: [--markdown-linebreak-ext=md]

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.16.10
    hooks:
      - id: ruff-check
        args: [--fix, --output-format=concise]
      - id: ruff-format

  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.30.1
    hooks:
      - id: gitleaks

  - repo: local
    hooks:
      - id: no-env-file
        name: never commit .env (use example.env)
        language: fail
        entry: ".env must not be committed"
        files: '(^|/)\.env$'
      - id: init-only-imports
        name: __init__.py holds imports only
        language: pygrep
        entry: '^(__all__|def |async def |class |if |try:|for |while )'
        files: '(^|/)__init__\.py$'
      - id: no-dynamic-imports
        name: no __import__, import at the top of the file
        language: pygrep
        entry: '__import__\('
        types: [python]
      - id: no-optional-imports
        name: import libraries directly, no ImportError fallback
        language: pygrep
        entry: 'except \(?(ImportError|ModuleNotFoundError)'
        types: [python]
      - id: import-linter
        name: import boundaries
        language: system
        entry: lint-imports
        pass_filenames: false
        types: [python]
```

## Others
- There is no need for functions to return 'int' as if on a c++ or OS script that return '0' or '1'... that is totally none-sense on python

# Template

We follow the [Python-project-template-AI-TL](https://github.com/MiquelGomezCorral/Python-project-template-AI-TL), so if you have to create a new project from scratch, create a repository using that as the template, clone it and then you can start coding. The template is already set up with the best practices and the structure that we want to follow.

File: `app/main.py` follow always this idea:

- Main is self-contained and calls other functions with arguments.
- Arguments are passed to a configuration object, not to functions directly.
- The structure of this file if user for ANY project and it must be preserved.

```python
"""Main file for scripts with arguments and call other functions."""

import dotenv
import argparse
from src.config import Configuration
from maikol_utils.other_utils import args_to_dataclass

def cmd_read_extract(args: argparse.Namespace):
    """Call read_extract_from_config_list with the given args."""
    CONFIG: Configuration = args_to_dataclass(args, Configuration)
    ...

def cmd_test(args):
    """Call test functions."""
    ...

# ======================================================================================
#                                       ARGUMENTS
# ======================================================================================
if __name__ == "__main__":
    dotenv.load_dotenv()

    parser = argparse.ArgumentParser(prog="app", description="Main Application CLI")
    parser.add_argument("--seed", type=int, default=42, help="Random seed (default: 42)")

    subparsers = parser.add_subparsers(dest="function", required=True)

    # ======================================================================================
    #                                       read_extract
    # ======================================================================================
    p_read = subparsers.add_parser("read-extract", help="Read and extract from config list")
    p_read.add_argument(
        "-d", "--dataset_name", type=str, default="Nuelas", help="Name of raw data folder"
    )
    p_read.add_argument("-m", "--max_files", type=int, default=None, help="Max files to load")
    p_read.add_argument(
        "-l", "--use_llm", action="store_false", default=True, help="Disable LLM extraction"
    )
    p_read.set_defaults(func=cmd_read_extract)

    # ======================================================================================
    #                                       test
    # ======================================================================================
    p_test = subparsers.add_parser("test", help="Test script with any code")
    p_test.set_defaults(func=cmd_test)

    # ======================================================================================
    #                                       CALL
    # ======================================================================================
    args = parser.parse_args()
    args.func(args)
```

Then, each script you define here, each p_... = subparsers, is a different file at the app/scripts. 
I want no clustering of independent scripts at a sigle file, each is owner of each own file.

# Configuration

Use the `./app/src/config/config.py` file and the class `Configuration` to store all the parameters and paths that can be modified by the user. The `Configuration` class should be designed to read from environment variables, configuration files, or command-line arguments, providing a centralized way to manage settings across the project.

- DO ALWAYS INSTANCE THE CONFIGURATION CLASS AS UPPERCASE

```python
...
CONFIG: Configuration = Configuration()
...

def functions(CONFIG: Configuration):
    ...
```

- Do use CONFIG instead of prop-drilling parameters. This will make the code more readable and maintainable + centralized.
- Settings (paths, hyperparameters, flags, model names) come from CONFIG; arguments carry data (tensors, frames, batches). Pass CONFIG down, never pieces of it. `max-args = 5` caps parameter lists; review catches the rest.
- When defining for and experiment or notebook new parameters that wont be used anywhere else on the project, and thus are 'local parameters', we can preserve the CONFIG class and add those parameters to it this way: With inheritance. Create a new class that inherits from CONFIG and add the new parameters to it. Then instantiate the new class and use it in the notebook or experiment. This way we can keep the CONFIG class clean and organized, and we can also use the new parameters in the notebook or experiment without affecting the rest of the project.

## Config

```python
"""Configuration file.
Configuration of project variables that we want to have available
everywhere and considered configuration.
"""
import yaml
from pathlib import Path
from dataclasses import dataclass
from typing import ClassVar, Optional
from maikol_utils.file_utils import make_dirs


@dataclass
class Configuration:
    """Configuration class for the project."""
    # ===================================================================
    #                       PATHS
    # ===================================================================
    WORKSPACE_PATH: ClassVar[Path] = Path(__file__).resolve().parents[3]
    DATA_PATH: ClassVar[Path] = WORKSPACE_PATH / "data"
    OUTPUT_PATH: ClassVar[Path] = WORKSPACE_PATH / "outputs"
    MODELS_PATH: ClassVar[Path] = WORKSPACE_PATH / "models"
    CONFIG_PATH: ClassVar[Path] = WORKSPACE_PATH / "config"
    LOGS_PATH: ClassVar[Path] = WORKSPACE_PATH / "logs"

    yaml_config_name: Optional[str] = None
    # ===================================================================
    #                       PARAMETER
    # ===================================================================
    exp_name: str = "base_name"
    seed: int = 42
    gym_id: Optional[str] = None
    learning_rate: float = 2.5e-4
    total_timesteps: int = 25_000
    torch_deterministic: bool = True
    cuda: bool = True
    track_run: bool = False
    wandb_project_name: str = "RL"
    wandb_entity: Optional[str] = None

    def __post_init__(self):
        # Basic setup: create folders and load yaml config if provided
        make_dirs([self.DATA_PATH, self.MODELS_PATH, self.LOGS_PATH, self.CONFIG_PATH])
        if self.yaml_config_name:
            self._load_yaml_configuration(self.yaml_config_name)
        # More stuff
        ...

    def _load_yaml_configuration(self, yaml_file: str) -> None:
        """Load config values from a YAML file under MODELS_PATH."""
        config_path = self.MODELS_PATH / yaml_file
        with open(config_path, "r", encoding="utf-8") as file:
            yaml_data = yaml.safe_load(file) or {}
        for key, value in yaml_data.items():
            if hasattr(self, key):
                setattr(self, key, value)
```

## Extend enum

When you have different configurations that share some common values, use `aenum.extend_enum` to add members to an existing enum. aenum refuses to subclass an enum that already has members (`TypeError: cannot extend`), so `extend_enum` is a function call that adds the new values to the original enum. This is useful for maintaining a clear and organized set of configuration options.

Use aenum instead of the standard enum module for `extend_enum`.

```python
from aenum import Enum, extend_enum

class Cats(Enum):
    SIBERIAN = "siberian"
    SPHINX = "sphinx"

extend_enum(Cats, "LABRADOR", "labrador")
extend_enum(Cats, "CORGI", "corgi")
```

# Paths

- Paths must be defined with Path to avoid issues with different OS.
- The core paths, such as 'DATA', 'MODELS', 'LOGS'... must be defined in the config.py file and used everywhere with `CONFIG.DATA_PATH / "raw"` or `CONFIG.MODELS_PATH / "model.pt"`. This will avoid issues with different OS and will make the code more readable.
  - Since we are importing from ./app and the data, models and logs file are at ./data, ./models and ./logs, we define these paths as follows:

```python
@dataclass
class Configuration:
    ...
    WORKSPACE_PATH: ClassVar[Path] = Path(__file__).resolve().parents[3]
    DATA_PATH: ClassVar[Path] = WORKSPACE_PATH / "data"
    OUTPUT_PATH: ClassVar[Path] = WORKSPACE_PATH / "outputs"
    MODELS_PATH: ClassVar[Path] = WORKSPACE_PATH / "models"
```

- and the rest of the paths must inherit form them.
- More Upercased paths can be defined if needed.
- Super experiments on notebooks that overcomplicate the paths and try to save a lot of files, must create a new conifguration class that inherits from the main one and adds the new paths there.
  - Only the paths that will be used on the rest of the app and are used on that notebook (such as the path to save the cleaned final data of that notebook) must be added to the new configuration class.

# maikol\_utils

maikol\_utils is my personal library that I do maintain and use on every single project. It must be used instead of auxiliar functions recreated. These are the most important and most used functions that will replace typical python hacks.

---

# Welcoome to maikol-utils 🧰 V 0.8.2

maikol-utils is a lightweight and reusable Python utility package designed to speed up and clean up your everyday scripting and automation workflows.

Whether you're handling JSON files, managing the file system, cleaning up terminal outputs, or improving logging with colored messages and structured separators - this module brings a collection of practical tools ready to use.

# 🧑‍💻 Author

Developed by [Miquel Gómez](https://miquelgc.net) – Python developer.
Hand-picked utilities from real-world scripting and automation tasks.

# 🚀 Features

- 🔹 Filesystem helpers: Easily check, load, save, and create files/directories.
- 🖨️ Colorful terminal prints: Add colored, formatted, or warning messages to your logs.
- 📜 Visual bash separators: Make your CLI outputs more structured and readable.
- 🧹 Terminal cleanup: Clear or update printed lines in-place for dynamic feedback.

# 📦 Installation

Option 1: *With pip*

1. With pip: `pip install maikol-utils`

Option 2: *Clonning the repo*

1. Clone it from [github](https://github.com/MiquelGomezCorral/maikol-utils): `git clone https://github.com/MiquelGomezCorral/maikol-utils`

### Examples of each function at the repo notebook

- This [notebook](https://github.com/MiquelGomezCorral/maikol-utils/blob/main/usage_examples.ipynb)

# 📘 Usage

```python
from maikol_utils.print_utils import print_separator, print_warn, clear_bash
from maikol_utils.file_utils import save_json, load_json

# Save data to JSON
save_json("outputs/data.json", {"name": "maikol"})

# Load safely from JSON
data = load_json("outputs/data.json")

# Print a section title with visual separator
print_separator("Processing Data", sep_type="SUPER")

# Warn with color
print_warn("This file is missing some fields!")

# Clean last 2 terminal lines
clear_bash(2)
```

# Functions Overview

### File system

```python
save_json(path, content) # Save Python object to JSON.

load_json(path) # Load JSON or return empty dict if not found.

check_dirs_existance(paths) # Assert if dirs exist.

make_dirs(paths) # Create dirs if not present.

list_dir_files(path) # List all the files on a directory

change_file_ext(path, new_extensions) # Yes
```

### Terminal Printing

```python
print_separator(text, sep_type) # Print formatted section headers.
# List of valid sep_type: ["SHORT", "NORMAL", "LONG", "SUPER", "START", "END"]

print_color(text, color) # Print in red, green, blue, etc.

print_warn(text) # Print warnings wrapped in ⚠️ emojis.

print_error(text) # Print errors wrapped in ❌ emojis.

print_status(msg) # Overwrite previous line with dynamic status.

clear_bash(n) # Clear n lines above in terminal.

print_clear_bash(text, n) # Clear then print a new message.

print_time(sec) # Print the time in seconds to pretty
```

### Other utils

```python
parse_seconds_to_minutes(sed) # Paste the time in seconds to pretty, just get the string not print

args_to_dataclass(agrs, data_class)
# It will change all the fields that have ben added to the args.
# If a field is not added in the args will be ignored.
# Fields in the args that are not in the Config this will be ignored.
```

---

