const ENDPOINT          = process.env['ENDPOINT'];
const GITHUB_TOKEN      = process.env['GITHUB_TOKEN'];
const GITHUB_OWNER      = process.env['GITHUB_OWNER'];
const GITHUB_REPOSITORY = process.env['GITHUB_REPOSITORY'];
const GITHUB_LABELS     = process.env['GITHUB_LABELS'];
const SLACK_URL         = process.env['SLACK_URL'];
const SLACK_TOKEN       = process.env['SLACK_TOKEN'];
const SLACK_CHANNEL     = process.env['SLACK_CHANNEL'];
const SLACK_MENTION     = process.env['SLACK_MENTION'];
const SLACK_MESSAGE     = process.env['SLACK_MESSAGE'];
const fetch = require('node-fetch');

exports.handler = async (event) => {
  // graph queryの組み立て
  const query = `
    query {
      repository(owner: ${GITHUB_OWNER}, name: ${GITHUB_REPOSITORY}) {
        pullRequests(first: 100, states: OPEN, labels: ${GITHUB_LABELS}) {
          totalCount,
          nodes {
            ... on PullRequest {
              title,
              url,
              labels(first: 100) {
                nodes {
                  ... on Label {
                    name
                  }
                }
              },
              reviews(first: 100, states: [APPROVED]) {
                totalCount
              }
            }
          }
        }
      }
    }`

  // ID情報取得用
  // try {
  //   const res = await fetch(`https://slack.com/api/usergroups.list?token=${SLACK_TOKEN}&include_users=false`)
  //   const jso = await res.json();
  //   jso.map(j => {
  //     console.log(j);
  //   })
  // } catch (error) {
  //   console.error(error);
  // }

  let lines = [SLACK_MENTION];
  lines.push(SLACK_MESSAGE);

  // githubからpull request取得
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`
      },
      body: JSON.stringify({ query })
    });
    const json = await response.json();
    json.data.repository.pullRequests.nodes.map(pr => {
      if (pr.labels.nodes.length === 1) {
        // lines.push(`${pr.url} ${pr.title}`)
        lines.push(pr.url)
      }
    });
  } catch (error) {
    console.error(error);
  }

  const body = {
        channel: SLACK_CHANNEL,
        username: 'Github Notice',
        text: lines.join('\n')
      }
  
  // slackにpost
  try {
    const response2 = await fetch(SLACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SLACK_TOKEN}`
      },
      body: JSON.stringify(body)
    });
    const json2 = await response2.json();
  } catch (error) {
    console.error(error);
  }
};
