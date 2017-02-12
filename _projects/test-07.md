---
title: Test Project
date: '2017-02-06'
image: test.png
---

{% capture filler %}{% include lorem-ipsum.md %}{% endcapture %}
{{ filler | truncatewords: 100 | markdownify }}
