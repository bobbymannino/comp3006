---
title: "COMP3006: User Acceptance Testing"
subtitle: "Testing"
author: "Bobby Mannino"
company: "University of Plymouth, Student Number 10878582"
---

## Introduction

This document is the template for a single user acceptance testing form. Each
participant should fill this document out during their testing themselves, or in
certain circumstances I will fill it out whilst they are testing.

## Participant and Session Information

Table: Participant Details

|                                           |     |
| ----------------------------------------- | --: |
| **Name**                                  |     |
| **Age**                                   |     |
| **Self-Assessed Technical Ability (/10)** |     |
| **Self-Assessed Patience (/10)**          |     |

Table: Test Session Environment

|                                         |     |
| --------------------------------------- | --: |
| **Testing Date**                        |     |
| **Device Used (laptop/desktop/mobile)** |     |
| **OS Used (Windows/Mac/Android)**       |     |
| **Browser Used (Safari/Chrome/Edge)**   |     |

## Instructions

There will be a series of tasks for the participant to complete during the test
session. Each task will be marked against this key:

Table: Task Acceptances

| Result  | Meaning                               |
| ------- | ------------------------------------- |
| Pass    | Completed as desired                  |
| Fail    | Did not complete as desired           |
| Blocked | Could not test due to previous issues |

Each issue or blocker will be recorded with a severity rating from this table:

Table: Severity Ratings

| Severity | Meaning                                         |
| -------- | ----------------------------------------------- |
| Critical | Data loss or security issue                     |
| Major    | Feature is blocked or broken with no workaround |
| Minor    | Feature is blocked or broken with a workaround  |
| Cosmetic | Typo, visual, or wording issue                  |

## Test Cases

Complete each test case below in order, without help unless you are completely
stuck. Once a test case is done, fill in its table before moving on to the next
one. If anything went wrong, describe it in the comments.

### Test Case 1: Create an Account

From the home page, sign up for a new account using a display name, username,
email and password of your choosing.

**Expected result:** You are logged in straight away and your account page shows
your details with no posts.

Table: Test Case 1 Results

|                                |     |
| ------------------------------ | --: |
| **Result (Pass/Fail/Blocked)** |     |
| **Severity (if any issue)**    |     |
| **Comments**                   |     |

### Test Case 2: Log Out and Log Back In

Log out of your new account, then log back in with the username and password you
just chose.

**Expected result:** After logging out you can no longer see your account page;
after logging in you can.

Table: Test Case 2 Results

|                                |     |
| ------------------------------ | --: |
| **Result (Pass/Fail/Blocked)** |     |
| **Severity (if any issue)**    |     |
| **Comments**                   |     |

### Test Case 3: Write a Draft Post

Create a new post with a title, slug and some content, but do not publish it.

**Expected result:** The post shows on your account page but not on the home
page.

Table: Test Case 3 Results

|                                |     |
| ------------------------------ | --: |
| **Result (Pass/Fail/Blocked)** |     |
| **Severity (if any issue)**    |     |
| **Comments**                   |     |

### Test Case 4: Publish Your Post

Open the home page in a second tab. In the first tab, edit your draft post so
that it is published, then go back to the second tab without refreshing it.

**Expected result:** Your post appears at the top of the home page in the second
tab without you refreshing it.

Table: Test Case 4 Results

|                                |     |
| ------------------------------ | --: |
| **Result (Pass/Fail/Blocked)** |     |
| **Severity (if any issue)**    |     |
| **Comments**                   |     |

### Test Case 5: Like a Post

Find a post written by someone else, like it, then unlike it.

**Expected result:** The heart fills in and the like count goes up by one, then
both go back to how they were.

Table: Test Case 5 Results

|                                |     |
| ------------------------------ | --: |
| **Result (Pass/Fail/Blocked)** |     |
| **Severity (if any issue)**    |     |
| **Comments**                   |     |

### Test Case 6: Edit Your Account

Change your display name to something new.

**Expected result:** Your account page, and any posts you have written, show the
new display name.

Table: Test Case 6 Results

|                                |     |
| ------------------------------ | --: |
| **Result (Pass/Fail/Blocked)** |     |
| **Severity (if any issue)**    |     |
| **Comments**                   |     |

### Test Case 7: Delete Your Post

Delete the post you created in Test Case 3.

**Expected result:** You are asked to confirm, and once you do the post no
longer shows on your account page or the home page.

Table: Test Case 7 Results

|                                |     |
| ------------------------------ | --: |
| **Result (Pass/Fail/Blocked)** |     |
| **Severity (if any issue)**    |     |
| **Comments**                   |     |

### Test Case 8: Delete Your Account

Delete your account.

**Expected result:** You are asked to confirm, and once you do you are logged
out and can no longer log in with your details.

Table: Test Case 8 Results

|                                |     |
| ------------------------------ | --: |
| **Result (Pass/Fail/Blocked)** |     |
| **Severity (if any issue)**    |     |
| **Comments**                   |     |

## Ratings

Rate each question on a scale of 1 to 10, _1_ being strongly disagree and _10_
being strongly agree:

Table: Ratings

| Statement                                                | Rating (1-10) |
| -------------------------------------------------------- | ------------- |
| I understood the test process                            |               |
| I was satisfied with the user acceptance testing process |               |
| I liked the website design                               |               |
| The website felt and looked reliable                     |               |
| Using the website was easy                               |               |
| Any errors that occured were well explained              |               |
| There were no inconsistencies in the design              |               |

## Comments

Replace this text with any comments about the service. This can be related to
how the test was operated or the website itself. If you think a feature is
missing or something is broken that was untested, mention it here.
