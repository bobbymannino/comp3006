/// <reference types="jest" />
// The global `jest` is used rather than the import, as SWC only moves
// `jest.mock` calls above the imports when it is the global
import { beforeEach, describe, expect, it } from "@jest/globals";
import * as api from "@/lib/api";
import * as session from "@/lib/session";
import { deleteAccountAction, deletePostAction, loadPostsAction, setLikedAction } from "./actions";
import { loginAction } from "./login/actions";
import { signupAction } from "./signup/actions";
import { editAccountAction } from "./account/edit/actions";

// Next's redirect works by throwing, so it is mocked to throw something that can be checked for
class Redirect extends Error {
  constructor(public to: string) {
    super(`Redirect to ${to}`);
  }
}
jest.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Redirect(to);
  },
}));

jest.mock("@/lib/session", () => ({
  getSession: jest.fn(),
  setSession: jest.fn(),
  deleteSession: jest.fn(),
}));

// Everything but the error class, which the actions check for
jest.mock("@/lib/api", () => {
  const actual = jest.requireActual<typeof api>("@/lib/api");
  const mocked = Object.fromEntries(Object.keys(actual).map((key) => [key, jest.fn()]));
  return { ...mocked, ApiError: actual.ApiError };
});

const mockApi = jest.mocked(api);
const mockSession = jest.mocked(session);

const ME = { _id: "u1" } as Awaited<ReturnType<typeof api.getMe>>;

/** The page an action redirected to, failing if it returned instead */
async function redirectOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Redirect) return error.to;
    throw error;
  }
  throw new Error("Expected the action to redirect");
}

function formData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  jest.resetAllMocks();
  mockSession.getSession.mockResolvedValue("tok");
});

describe("loadPostsAction", () => {
  it("returns the page of posts with whether they are liked", async () => {
    const posts = [{ _id: "a" }] as api.PublicPost[];
    mockApi.getPosts.mockResolvedValue(posts);
    mockApi.withLiked.mockResolvedValue([{ ...posts[0], liked: true }]);

    await expect(loadPostsAction(2)).resolves.toEqual({ posts: [{ _id: "a", liked: true }] });
    expect(mockApi.getPosts).toHaveBeenCalledWith(2);
    expect(mockApi.withLiked).toHaveBeenCalledWith(posts, "tok");
  });

  it.each([
    [0, 1],
    [-5, 1],
    [2.7, 2],
    [NaN, 1],
    ["3" as unknown as number, 3],
    ["abc" as unknown as number, 1],
  ])("turns the page %p into %p", async (page, expected) => {
    mockApi.getPosts.mockResolvedValue([]);
    mockApi.withLiked.mockResolvedValue([]);
    await loadPostsAction(page);
    expect(mockApi.getPosts).toHaveBeenCalledWith(expected);
  });

  it("returns API errors rather than throwing them", async () => {
    mockApi.getPosts.mockRejectedValue(new api.ApiError(503, "Down"));
    await expect(loadPostsAction(1)).resolves.toEqual({ error: "Down" });
  });

  it("throws errors that are not from the API", async () => {
    mockApi.getPosts.mockRejectedValue(new Error("bug"));
    await expect(loadPostsAction(1)).rejects.toThrow("bug");
  });
});

describe("setLikedAction", () => {
  it("sends logged out users to log in", async () => {
    mockSession.getSession.mockResolvedValue(undefined);
    await expect(redirectOf(setLikedAction("p1", true))).resolves.toBe("/login");
    expect(mockApi.likePost).not.toHaveBeenCalled();
  });

  it("likes a post", async () => {
    await expect(setLikedAction("p1", true)).resolves.toEqual({});
    expect(mockApi.likePost).toHaveBeenCalledWith("p1", "tok");
    expect(mockApi.unlikePost).not.toHaveBeenCalled();
  });

  it("unlikes a post", async () => {
    await expect(setLikedAction("p1", false)).resolves.toEqual({});
    expect(mockApi.unlikePost).toHaveBeenCalledWith("p1", "tok");
    expect(mockApi.likePost).not.toHaveBeenCalled();
  });

  it("ignores liking a post that is already liked", async () => {
    mockApi.likePost.mockRejectedValue(new api.ApiError(409, "Already liked"));
    await expect(setLikedAction("p1", true)).resolves.toEqual({});
  });

  it("ignores unliking a post that is not liked", async () => {
    mockApi.unlikePost.mockRejectedValue(new api.ApiError(404, "Not liked"));
    await expect(setLikedAction("p1", false)).resolves.toEqual({});
  });

  it("returns a 404 when liking, as the post is missing", async () => {
    mockApi.likePost.mockRejectedValue(new api.ApiError(404, "No post"));
    await expect(setLikedAction("p1", true)).resolves.toEqual({ error: "No post" });
  });

  it("logs out and sends to log in when the session has ended", async () => {
    mockApi.likePost.mockRejectedValue(new api.ApiError(401, "Expired"));
    await expect(redirectOf(setLikedAction("p1", true))).resolves.toBe("/login");
    expect(mockSession.deleteSession).toHaveBeenCalled();
  });
});

describe("deleteAccountAction", () => {
  it("deletes the user from the session and logs them out", async () => {
    mockApi.getMe.mockResolvedValue(ME);
    await expect(redirectOf(deleteAccountAction())).resolves.toBe("/");
    expect(mockApi.deleteUser).toHaveBeenCalledWith("u1", "tok");
    expect(mockSession.deleteSession).toHaveBeenCalled();
  });

  it("returns API errors and stays logged in", async () => {
    mockApi.getMe.mockResolvedValue(ME);
    mockApi.deleteUser.mockRejectedValue(new api.ApiError(500, "Failed"));
    await expect(deleteAccountAction()).resolves.toEqual({ error: "Failed" });
    expect(mockSession.deleteSession).not.toHaveBeenCalled();
  });

  it("logs out and sends to log in when the session has ended", async () => {
    mockApi.getMe.mockRejectedValue(new api.ApiError(401, "Expired"));
    await expect(redirectOf(deleteAccountAction())).resolves.toBe("/login");
    expect(mockSession.deleteSession).toHaveBeenCalled();
    expect(mockApi.deleteUser).not.toHaveBeenCalled();
  });
});

describe("deletePostAction", () => {
  it("deletes the post and goes back to the account page", async () => {
    await expect(redirectOf(deletePostAction("p1"))).resolves.toBe("/account");
    expect(mockApi.deletePost).toHaveBeenCalledWith("p1", "tok");
    expect(mockSession.deleteSession).not.toHaveBeenCalled();
  });

  it("returns API errors", async () => {
    mockApi.deletePost.mockRejectedValue(new api.ApiError(403, "Not yours"));
    await expect(deletePostAction("p1")).resolves.toEqual({ error: "Not yours" });
  });

  it("sends logged out users to log in", async () => {
    mockSession.getSession.mockResolvedValue(undefined);
    await expect(redirectOf(deletePostAction("p1"))).resolves.toBe("/login");
    expect(mockApi.deletePost).not.toHaveBeenCalled();
  });
});

describe("loginAction", () => {
  it("stores the session and goes home", async () => {
    mockApi.login.mockResolvedValue({ token: "new", expiresAt: "2030-01-01T00:00:00.000Z" });
    const form = formData({ username: "bobby", password: "pw" });

    await expect(redirectOf(loginAction({}, form))).resolves.toBe("/");
    expect(mockApi.login).toHaveBeenCalledWith({ username: "bobby", password: "pw" });
    expect(mockSession.setSession).toHaveBeenCalledWith("new", "2030-01-01T00:00:00.000Z");
  });

  it("returns the error and username, but never the password", async () => {
    mockApi.login.mockRejectedValue(new api.ApiError(401, "Wrong details"));
    const state = await loginAction({}, formData({ username: "bobby", password: "pw" }));
    expect(state).toEqual({ error: "Wrong details", values: { username: "bobby" } });
  });

  it("sends empty strings for missing fields", async () => {
    mockApi.login.mockRejectedValue(new api.ApiError(400, "Bad"));
    await loginAction({}, formData({}));
    expect(mockApi.login).toHaveBeenCalledWith({ username: "", password: "" });
  });
});

describe("signupAction", () => {
  const fields = {
    username: "bobby",
    email: "b@example.com",
    displayName: "Bobby",
    password: "pw",
  };

  it("stores the session and goes home", async () => {
    mockApi.signup.mockResolvedValue({
      token: "new",
      expiresAt: "2030-01-01T00:00:00.000Z",
    } as Awaited<ReturnType<typeof api.signup>>);

    await expect(redirectOf(signupAction({}, formData(fields)))).resolves.toBe("/");
    expect(mockApi.signup).toHaveBeenCalledWith(fields);
    expect(mockSession.setSession).toHaveBeenCalledWith("new", "2030-01-01T00:00:00.000Z");
  });

  it("returns the error and values, but never the password", async () => {
    mockApi.signup.mockRejectedValue(new api.ApiError(409, "Username taken"));
    const state = await signupAction({}, formData(fields));
    expect(state).toEqual({
      error: "Username taken",
      values: { username: "bobby", email: "b@example.com", displayName: "Bobby" },
    });
  });
});

describe("editAccountAction", () => {
  const fields = { displayName: "Bobby", username: "bobby", email: "b@example.com" };

  beforeEach(() => {
    mockApi.getMe.mockResolvedValue(ME);
  });

  it("keeps the current password when none is given", async () => {
    await expect(
      redirectOf(editAccountAction({}, formData({ ...fields, password: "" }))),
    ).resolves.toBe("/account");
    expect(mockApi.updateUser).toHaveBeenCalledWith("u1", fields, "tok");
  });

  it("changes the password when one is given", async () => {
    await redirectOf(editAccountAction({}, formData({ ...fields, password: "new" })));
    expect(mockApi.updateUser).toHaveBeenCalledWith("u1", { ...fields, password: "new" }, "tok");
  });

  it("returns the error and values, but never the password", async () => {
    mockApi.updateUser.mockRejectedValue(new api.ApiError(409, "Email taken"));
    const state = await editAccountAction({}, formData({ ...fields, password: "new" }));
    expect(state).toEqual({ error: "Email taken", values: fields });
  });

  it("logs out and sends to log in when the session has ended", async () => {
    mockApi.getMe.mockRejectedValue(new api.ApiError(401, "Expired"));
    await expect(redirectOf(editAccountAction({}, formData(fields)))).resolves.toBe("/login");
    expect(mockSession.deleteSession).toHaveBeenCalled();
  });

  it("sends logged out users to log in", async () => {
    mockSession.getSession.mockResolvedValue(undefined);
    await expect(redirectOf(editAccountAction({}, formData(fields)))).resolves.toBe("/login");
    expect(mockApi.getMe).not.toHaveBeenCalled();
  });
});
