# GitHub Asana Integration Action

When used with the `pull_request` trigger, the PR URL will be commented on the Asana Task. The Asana Task URL will also be commented on the PR.

To get this to work, the branch must be named in the following way: `<name-of-feature>/<asana-task-id>`

## Create an action from this template

To use this action you must provide two tokens:

- Asana Token
  - This can be found in the user settings of your Asana account. It is recommended that a new Asana User is created as this is the user that will be used to comment on tasks.
- GitHub Token
  - This is automatically registered as an environment variable in every GitHub workflow, this is accessed with: `${{ secrets.GITHUB_TOKEN }}`

See below for an example:

```yaml
with:
  asana-token: ${{ secrets.ASANA_ACCESS_TOKEN }}
  github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Usage

You can now consume the action by referencing the v1 branch

```yaml
uses: kinnersleym/github-asana-action@v1
with:
  asana-token: ${{ secrets.ASANA_ACCESS_TOKEN }}
  github-token: ${{ secrets.GITHUB_TOKEN }}
```
