---
layout: single
title: "Teaching"
permalink: /teaching/
author_profile: true
---

{% assign teaching_items = site.teaching | where: "type", "teaching" | sort: "date" | reverse %}
{% assign service_items  = site.teaching | where: "type", "service"  | sort: "date" | reverse %}

## Teaching & Mentoring
{% for post in teaching_items %}
  {% include archive-single.html %}
{% endfor %}

## Service & Leadership
{% for post in service_items %}
  {% include archive-single.html %}
{% endfor %}
