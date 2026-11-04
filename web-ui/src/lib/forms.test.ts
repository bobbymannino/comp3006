/**
 * @jest-environment jsdom
 */
import { describe, expect, it } from "@jest/globals";
import * as v from "valibot";
import {
  EditAccountFormSchema,
  LoginFormSchema,
  PostFormSchema,
  SignupFormSchema,
  slugify,
  validateForm,
} from "./forms";

/** Build a form with a text input for each field */
function form(fields: Record<string, string>) {
  const el = document.createElement("form");
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.name = name;
    input.value = value;
    el.append(input);
  }
  return el;
}

const validSignup = {
  displayName: "Bobby",
  username: "bobby_1",
  email: "bobby@example.com",
  password: "hunter2",
};

describe("slugify", () => {
  it("lowercases and joins words with dashes", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("drops punctuation", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("collapses runs of separators into one dash", () => {
    expect(slugify("a  --  b___c")).toBe("a-b-c");
  });

  it("trims dashes from the ends", () => {
    expect(slugify("  --Hello--  ")).toBe("hello");
  });

  it("removes accents from letters", () => {
    expect(slugify("Café Creme")).toBe("cafe-creme");
  });

  it("keeps numbers", () => {
    expect(slugify("Top 10 Tips")).toBe("top-10-tips");
  });

  it("gives an empty slug for a title with no letters or numbers", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("makes slugs the post form accepts", () => {
    const slug = slugify("My First Post: An Intro!");
    expect(v.is(PostFormSchema.entries.slug, slug)).toBe(true);
  });
});

describe("validateForm", () => {
  it("gives no errors for a valid form", () => {
    expect(validateForm(SignupFormSchema, form(validSignup))).toEqual({});
  });

  it("gives the user facing message for an invalid field", () => {
    const errors = validateForm(SignupFormSchema, form({ ...validSignup, username: "No Caps" }));
    expect(errors).toEqual({
      username: "Use 3 to 32 lowercase letters, numbers or underscores.",
    });
  });

  it("gives an error for each invalid field", () => {
    const errors = validateForm(
      SignupFormSchema,
      form({ ...validSignup, email: "not an email", displayName: "" }),
    );
    expect(errors).toEqual({
      displayName: "Enter a display name.",
      email: "Enter a valid email address.",
    });
  });

  it("treats missing fields as empty", () => {
    const errors = validateForm(LoginFormSchema, form({}));
    expect(errors).toEqual({
      username: "Enter your username.",
      password: "Enter your password.",
    });
  });

  it("ignores fields that are not in the schema", () => {
    const errors = validateForm(
      LoginFormSchema,
      form({ username: "bobby", password: "pw", $ACTION_ID_abc: "" }),
    );
    expect(errors).toEqual({});
  });
});

describe("LoginFormSchema", () => {
  it("rejects an empty username", () => {
    expect(v.is(LoginFormSchema, { username: "", password: "pw" })).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(v.is(LoginFormSchema, { username: "bobby", password: "" })).toBe(false);
  });
});

describe("EditAccountFormSchema", () => {
  it("allows an empty password to keep the current one", () => {
    expect(v.is(EditAccountFormSchema, { ...validSignup, password: "" })).toBe(true);
  });

  it("still checks the other fields", () => {
    expect(v.is(EditAccountFormSchema, { ...validSignup, username: "x" })).toBe(false);
  });
});

describe("PostFormSchema", () => {
  const validPost = { title: "Hello", slug: "hello-world", content: "" };

  it("allows empty content", () => {
    expect(v.is(PostFormSchema, validPost)).toBe(true);
  });

  it("rejects an empty title", () => {
    expect(v.is(PostFormSchema, { ...validPost, title: "" })).toBe(false);
  });

  it.each(["Hello", "hello--world", "-hello", "hello-", "hello world", ""])(
    "rejects the slug %p",
    (slug) => {
      expect(v.is(PostFormSchema, { ...validPost, slug })).toBe(false);
    },
  );
});
