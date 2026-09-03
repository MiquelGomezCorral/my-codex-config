---
name: python-project-setup
description: Set up or maintain Python projects using the MiquelGomezCorral conda, uv, editable app-package, requirements.txt, and Jupyter conventions. Follow an existing repository when it differs.
---

# Python Project Setup

Follow the repository first. Use these defaults only when creating or maintaining a
project based on the MiquelGomezCorral template.

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
configs/
data/
notebooks/
```

`app/` is both the source folder and editable package. Preserve this package discovery:

```toml
[project]
name = "app"
version = "0.1.0"

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

Keep configuration standalone and expose one `Configurations` instance as `CONFIG`.
Use `os.path.join` for repository paths and keep user-adjustable paths and parameters
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
- All files within a package that import from the same package, must do if with the patterns `from .file_name import ...'.
- All files within a package that import from another package must do so with `from src.package_name import ...`
- Scripts folder are considered packages and must have an `__init__.py` file. They can only be imported from main.py or from other scripts. They cannot be imported from src or any other package.
- config.py must never import from any other package. It is the only file that can be imported from anywhere without restrictions. We can define other files at src/config and import them from config.py, but those cannot import from any other package. This is to avoid circular imports and to have a single source of truth for configuration.
- Notebooks need no weird os.path hacks since this setup works for them as well.
- Add the `python -m ipykernel install --user --name=venv --display-name "Python (venv)"` to make the env work for notebooks.

## Environment variables
- Use `.env` for local environment variables and `example.env` for placeholders.
- Use `dotenv` to load the `.env` file in main.py and any other script that needs it.
- Do not rely on bash environment variables for scripts or notebooks.

# Template
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
    CONFIG: Configuration = args_to_dataclass(args)
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

# Configuration
Use the `./app/scr/config/config.py` file and the class `Configuration` to store all the parameters and paths that can be modified by the user. The `Configuration` class should be designed to read from environment variables, configuration files, or command-line arguments, providing a centralized way to manage settings across the project.

- DO ALWAYS INSTANCE THE CONFIGURATION CLASS AS UPPERCASE
```python
...
CONFIG: Configuration = Configuration()
...

def functions(CONFIG: Configuration):
    ...
```


## Config
```python
"""Configuration file.

Configuration of project variables that we want to have available
everywhere and considered configuration.
"""
import os
import dataclasses
from dataclasses import dataclass
from argparse import Namespace

@dataclass
class Configuration:
    """Configuration class for the project."""

    exp_name: str = "base_name"
    seed:     int = 42

    gym_id:          str = None
    learning_rate: float = 2.5e-4
    total_timesteps: int = 25_000

    torch_deterministic: bool = True
    cuda:                bool = True

    track_run:         bool = False
    wandb_project_name: str = "RL"
    wandb_entity:       str = None

    def __post_init__(self):
        """Post-initialization."""
        ...
```

## Extend enum
```python
def extend_enum(inherited_enum):
    """Extend an enum with another enum."""
    def wrapper(added_enum):
        joined = {}
        for item in inherited_enum:
            joined[item.name] = item.value
        for item in added_enum:
            joined[item.name] = item.value
        return Enum(added_enum.__name__, joined)
    return wrapper


class Cats(Enum):
    SIBERIAN = "siberian"
    SPHINX = "sphinx"


@extend_enum(Cats)
class Animals(Enum):
    LABRADOR = "labrador"
    CORGI = "corgi"
```

# Paths
- Paths must be defined with os.path.join to avoid issues with different OS.
- The core paths, such as 'DATA', 'MODELS', 'LOGS'... must be defined in the config.py file and used everywhere with os.path.join(CONFIG.DATA, "raw") or os.path.join(CONFIG.MODELS, "model.pt"). This will avoid issues with different OS and will make the code more readable.
  - Since we are importing from ./app and the data, models and logs file are at ./data, ./models and ./logs, we define these paths as follows:
```python
@dataclass
class Configuration:
    ...
    DATA: str = os.path.join(.., "data")
    MODELS: str = os.path.join(.., "models")
    LOGS: str = os.path.join(.., "logs")
```
  - and the rest of the paths must inherit form them.
  - More Upercased paths can be defined if needed.
- Super experiments on notebooks that overcomplicate the paths and try to save a lot of files, must create a new conifguration class that inherits from the main one and adds the new paths there.
  - Only the paths that will be used on the rest of the app and are used on that notebook (such as the path to save the cleaned final data of that notebook) must be added to the new configuration class.

# maikol_utils
maikol_utils is my personal library that I do maintain and use on every single project. It must be used instead of auxiliar functions recreated. These are the most important and most used functions that will replace typical python hacks.

---
# Welcoome to maikol-utils 🧰 V 0.8.2
maikol-utils is a lightweight and reusable Python utility package designed to speed up and clean up your everyday scripting and automation workflows.

Whether you're handling JSON files, managing the file system, cleaning up terminal outputs, or improving logging with colored messages and structured separators - this module brings a collection of practical tools ready to use.

# 🧑‍💻 Author

Developed by [Miquel Gómez](https://miquelgc.net) – Python developer.
Hand-picked utilities from real-world scripting and automation tasks.

# Structure

```
├── LICENSE
├── README.md
├── maikol-utils
│   ├── __init__.py
│   ├── file_utils.py
│   ├── print_utils.py
│   └── time_tracker.py
├── pyproject.toml
├── setup.py
└── usage_examples.ipynb
```

# 🚀 Features

- 🔹 Filesystem helpers: Easily check, load, save, and create files/directories.
- 🖨️ Colorful terminal prints: Add colored, formatted, or warning messages to your logs.
- 📜 Visual bash separators: Make your CLI outputs more structured and readable.
- 🧹 Terminal cleanup: Clear or update printed lines in-place for dynamic feedback.

# 📦 Installation

Option 1: _With pip_

1. With pip: `pip install maikol-utils`

Option 2: _Clonning the repo_

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
