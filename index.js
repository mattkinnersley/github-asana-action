const core = require("@actions/core");
const github = require("@actions/github");
const asana = require("asana");

const initAsana = ({ asanaToken }) => {
  return asana.Client.create().useAccessToken(asanaToken);
};
const initOctokit = ({ githubToken }) => {
  return github.getOctokit(githubToken);
};

const getAsanaTask = async ({ gid, client }) => {
  const task = await client.tasks.getTask(gid);
  if (!task) {
    throw new Error(`Task not found with gid: ${gid}`);
  }
  return task;
};

const getAsanaTaskUrl = async ({ gid, client }) => {
  const { permalink_url } = await getAsanaTask({ gid, client });
  if (!permalink_url) {
    throw new Error(`Task URL not found for gid: ${gid}`);
  }
  return permalink_url;
};

const addPRToAsanaTask = async ({ gid, prUrl, client }) => {
  const comment = `GitHub PR: ${prUrl}`;
  return await client.stories.createStoryForTask(gid, { text: comment });
};

const commentOnIssue = async ({
  asanaTaskUrl,
  owner,
  repo,
  issue_number,
  client,
}) => {
  const comment = `Asana Task: ${asanaTaskUrl}`;
  return await client.issues.createComment({
    owner,
    repo,
    issue_number,
    body: comment,
  });
};

const isWholeNumber = ({ gid }) => gid.indexOf(".") == -1 && !isNaN(gid);

const is16Digits = ({ gid }) => gid.length == 16;

const validRef = ({ ref }) => ref.lastIndexOf("/") != -1;

const validGid = ({ gid }) => isWholeNumber({ gid }) && is16Digits({ gid });

const getAsanaTaskGid = ({ ref }) => {
  if (!validRef({ ref })) {
    return null;
  }

  const gid = ref.substring(ref.lastIndexOf("/") + 1);

  if (!validGid({ gid })) {
    return null;
  }

  return gid;
};

const getGithubDetails = ({
  context: {
    payload: {
      pull_request: {
        head: { ref },
        html_url: prUrl,
        number: issue_number,
      },
      repository: { full_name },
    },
  },
}) => {
  validateGithubDetails([
    { name: "pr ref", value: ref },
    { name: "pr url", value: prUrl },
    { name: "issue number", value: issue_number },
    { name: "repo name", value: full_name },
  ]);
  return { ref, prUrl, issue_number, full_name };
};

const validateGithubDetails = (properties) => {
  const undefinedProperties = [];
  properties.forEach((property) => {
    if (!property.value) {
      undefinedProperties.push(property.name);
    }
  });
  if (undefinedProperties.length > 0) {
    throw new Error(
      `Cannot find the following properties: ${undefinedProperties.join(", ")}`
    );
  }
};

const run = async () => {
  try {
    const asanaToken = core.getInput("asana-token");
    const githubToken = core.getInput("github-token");

    const asanaClient = initAsana({ asanaToken });
    const octoKitClient = initOctokit({ githubToken });

    const { ref, prUrl, issue_number, full_name } = getGithubDetails(github);

    const [owner, repo] = full_name.split("/");

    const gid = getAsanaTaskGid({ ref });

    if (gid) {
      await addPRToAsanaTask({
        gid,
        prUrl,
        client: asanaClient,
      });

      const asanaTaskUrl = await getAsanaTaskUrl({ gid, client: asanaClient });

      await commentOnIssue({
        asanaTaskUrl,
        owner,
        repo,
        issue_number,
        client: octoKitClient,
      });
      core.setOutput("asana-task", asanaTaskUrl);
    } else {
      core.setOutput(
        "asana-task",
        `No Asana Task ID found in ref: ${ref} Check the branch is of the format {feature}/{id} where id is a 16 digit integer and a valid Asana Task ID found in the URL of the task.`
      );
    }
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();

module.exports = { getAsanaTaskGid, getGithubDetails, getAsanaTask };
