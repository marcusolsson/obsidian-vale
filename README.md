# Obsidian Vale

[![Build Obsidian plugin](https://github.com/marcusolsson/obsidian-vale/actions/workflows/release.yml/badge.svg)](https://github.com/marcusolsson/obsidian-vale/actions/workflows/release.yml)
[![Donate](https://img.shields.io/badge/donate-paypal-blue)](https://www.paypal.com/donate/?hosted_button_id=NT93NXBDFWH6J)

A [Vale](https://docs.errata.ai/) client for Obsidian.

![Screenshot](screenshot.png)

## Prerequisites

- [Vale Server](https://docs.errata.ai/vale-server/install/) **or** [Vale CLI](https://docs.errata.ai/vale/about)

## Configuration

To install Vale CLI:

1. Go to their [release page](https://github.com/errata-ai/vale/releases).
1. Under **Assets**, download the version for your operating system.
1. Extract the downloaded archive.

To configure the plugin:

1. Go to the settings tab for the plugin.
1. Enable **Use CLI**.
1. In **CLI: Path**, enter the absolute path to the `vale` (`vale.exe` on Windows).

To get the most out of Vale, you want to install some _styles_. By default, only one style is enabled for basic spellchecking.

To add more styles, you need to install and enable them:

1. In the **Command Palette**, select **Vale: Install style**.
1. Select the style you want to install.
1. In the **Command Palette**, select **Vale: Enable style**.
1. Select the style you want to enable.

### Advanced users

The plugin ships with a basic `.vale.ini` configuration file, which you can find at `.obsidian/plugins/obsidian-vale/data/.vale.ini`.

If you're using your own configuration file, you can still use the plugin to manage your styles.
