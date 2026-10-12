---
title: "COMP3006: Full-Stack Development Report 2026/27"
author: "Bobby Mannino"
---

## Links

**GitHub Repository:**
[github.com/bobbymannino/comp3006](https://github.com/bobbymannino/comp3006)

**YouTube Video:** _TODO_

## Introduction

The project I have decided to pursue is making a blog. The functionality of the
blog is as follows:

- Anybody can create an account
- Users can edit/delete their own accounts
- Users can create/read/update/delete their own posts
- Users can like their own and other peoples posts
- On each posts page there will be a live visitor count

## Target Audience

There is no specific demographic or user base in mind for this project, it is
designed for any user. A high priority for this project is **usability** and
**efficiency**. I would like the people who use this to know instantly without
any training or documentation how to use the product, as well as the product
feeling fast to use.

## Existing Products

There are several existing products that provide similar functionality to this
project. Some of the most popular ones include:

- TODO

## Architecture

### Architecture Topology

The product will follow a microservices architecture. There will be 4 Docker
images in this project:

- Nginx
- Database
- API
- Web UI

Each one runs independently and communicate with each other, for instance to
access the database you must use the API, to use the web UI you must use the
Nginx server. Putting the API and Web UI into their own containers allows you to
scale them independently and update them separately. If traffic becomes API
heavy you can scale those up, or if the user wants to host the API without
having any UI they can do that without any changes to the API container.

![Architecture Topology](topology.png){width=500px}

> [!NOTE]
> Whilst it is possible to have multiple databases (read replicas) that is out
> of scope for this project so it will remain a single container.
