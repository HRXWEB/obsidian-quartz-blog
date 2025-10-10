---
title: 
draft: 
aliases: []
tags: []
created: 2025-09-24T16:54:25.2525+08:00
updated: 2025-10-10T18:10:19.1919+08:00
---

[https://unix.stackexchange.com/a/33005](https://unix.stackexchange.com/a/33005)

There are two levels of interpretation here: the shell, and sed.

In the shell, everything between single quotes is interpreted literally, except for single quotes themselves. You can effectively have a single quote between single quotes by writing `'\''`(close single quote, one literal single quote, open single quote).

Sed uses [basic regular expressions](http://en.wikipedia.org/wiki/Regular_expression#POSIX_basic_and_extended). In a BRE, in order to have them treated literally, the characters `$.*[\^` need to be quoted by preceding them by a backslash, except inside character sets (`[…]`). Letters, digits and `(){}+?|` must not be quoted (you can get away with quoting some of these in some implementations). The sequences `\(`, `\)`, `\n`, and in some implementations `\{`, `\}`, `\+`, `\?`, `\|` and other backslash+alphanumerics have special meanings. You can get away with not quoting `$^` in some positions in some implementations.

Furthermore, you need a backslash before `/` if it is to appear in the regex outside of bracket expressions. You can choose an alternative character as the delimiter by writing, e.g., `s~/dir~/replacement~` or `\~/dir~p`; you'll need a backslash before the delimiter if you want to include it in the BRE. If you choose a character that has a special meaning in a BRE and you want to include it literally, you'll need three backslashes; I do not recommend this, as it may behave differently in some implementations.

In a nutshell, for `sed 's/…/…/'`:

- Write the regex between single quotes.
- Use `'\''` to end up with a single quote in the regex.
- Put a backslash before `$.*/[\]^` and only those characters (but not inside bracket expressions). (Technically you shouldn't put a backslash before `]` but I don't know of an implementation that treats `]` and `\]` differently outside of bracket expressions.)
- Inside a bracket expression, for  to be treated literally, make sure it is first or last (`[abc-]` or `[-abc]`, not ).

    ~~`[a-bc]`~~

- Inside a bracket expression, for `^` to be treated literally, make sure it is _not_ first (use `[abc^]`, not ).

    ~~`[^abc]`~~

- To include `]` in the list of characters matched by a bracket expression, make it the first character (or first after `^` for a negated set): `[]abc]` or `[^]abc]` (not ).

    ~~`[abc]]` nor `[abc\]]`~~

In the replacement text:

- `&` and `\` need to be quoted by preceding them by a backslash, as do the delimiter (usually `/`) and newlines.
- `\` followed by a digit has a special meaning. `\` followed by a letter has a special meaning (special characters) in some implementations, and `\` followed by some other character means `\c` or `c` depending on the implementation.
- With single quotes around the argument (`sed 's/…/…/'`), use `'\''` to put a single quote in the replacement text.

If the regex or replacement text comes from a shell variable, remember that

- The regex is a BRE, not a literal string.
- In the regex, a newline needs to be expressed as `\n` (which will never match unless you have other `sed` code adding newline characters to the pattern space). But note that it won't work inside bracket expressions with some `sed` implementations.
- In the replacement text, `&`, `\` and newlines need to be quoted.
- The delimiter needs to be quoted (but not inside bracket expressions).
- Use double quotes for interpolation: `sed -e "s/$BRE/$REPL/"`.