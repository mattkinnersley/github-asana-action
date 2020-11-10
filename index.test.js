const {
  getAsanaTaskGid,
  getGithubDetails,
  getAsanaTask,
} = require("./index.js");

const mockGid = "1234567891234567";
const mockShortGid = "123456789";
const mockRef = `some-new-feature/${mockGid}`;
const mockMissingIdRef = `some-new-feature/`;
const mockInvalidStructureRef = `${mockGid}/some-new-feature`;
const mockMissingSlashRef = `some-new-feature-${mockGid}`;
const mockShortGidRef = `some-new-feature/${mockShortGid}`;
const mockLongGidRef = `some-new-feature/${mockGid}12345`;

const mockOwner = "cool-owner";
const mockRepo = "cool-asana-repo";
const mockIssueNumber = "10";
const mockPrUrl = `https://github.com/${mockOwner}/${mockRepo}/pull/${mockIssueNumber}`;
const mockRepoFullName = `${mockOwner}/${mockRepo}`;

const mockGithubData = {
  context: {
    payload: {
      pull_request: {
        head: { ref: mockRef },
        html_url: mockPrUrl,
        number: mockIssueNumber,
      },
      repository: { full_name: mockRepoFullName },
    },
  },
};

const mockInvalidGithubData = {
  context: {
    payload: {
      pull_request: {
        head: { ref: "" },
        html_url: mockPrUrl,
        number: mockIssueNumber,
      },
      repository: { full_name: "" },
    },
  },
};

const mockAsanaClient = {
  tasks: {
    getTask: jest.fn((x) => x),
  },
  stories: {
    createStoryForTask: jest.fn(),
  },
};

describe("getAsanaTaskGid", () => {
  it("should extract asana task id from branch", async () => {
    await expect(getAsanaTaskGid({ ref: mockRef })).toBe(mockGid);
  });
  it("should throw error with missing id", async () => {
    await expect(getAsanaTaskGid({ ref: mockMissingIdRef })).toBeNull();
  });
  it("should throw error with invalid branch structure", async () => {
    await expect(getAsanaTaskGid({ ref: mockInvalidStructureRef })).toBeNull();
  });
  it("should throw error with missing slash in ref", async () => {
    await expect(getAsanaTaskGid({ ref: mockMissingSlashRef })).toBeNull();
  });
  it("should throw error with short gid length in ref", async () => {
    await expect(getAsanaTaskGid({ ref: mockShortGidRef })).toBeNull();
  });
  it("should throw error with long gid length in ref", async () => {
    await expect(getAsanaTaskGid({ ref: mockLongGidRef })).toBeNull();
  });
});

describe("getGithubDetails", () => {
  it("should extract correct details from github context", async () => {
    const { ref, prUrl, issue_number, full_name } = getGithubDetails(
      mockGithubData
    );
    expect(ref).toBe(mockRef);
    expect(prUrl).toBe(mockPrUrl);
    expect(issue_number).toBe(mockIssueNumber);
    expect(full_name).toBe(mockRepoFullName);
  });

  it("should throw error if github context does not have one of required properties", async () => {
    expect(() => getGithubDetails(mockInvalidGithubData)).toThrow(
      `Cannot find the following properties: pr ref, repo name`
    );
  });
});

describe("getAsanaTask", () => {
  it("should get asana task with given id", async () => {
    await getAsanaTask({
      gid: mockGid,
      client: mockAsanaClient,
    });
    expect(mockAsanaClient.tasks.getTask).toBeCalled();
  });
  it("should throw error when not given id", async () => {
    let error;
    try {
      await getAsanaTask({ gid: "", client: mockAsanaClient });
    } catch (e) {
      error = e;
    }
    expect(error).toEqual(new Error("Task not found with gid: "));
  });
});
