const { resolveGithubDiscordUser } = require('../config/githubUserMap');

function buildActorProfile(actor) {
  const match = resolveGithubDiscordUser(actor);
  const fallback =
    actor?.login || actor?.name || actor?.username || actor?.email || 'Quelqu\'un';
  const displayName = match.displayName || fallback;
  const mention = match.discordUserId ? `<@${match.discordUserId}>` : `**${displayName}**`;
  return { mention, label: displayName };
}

function buildPrefix(roleMention, actorMention) {
  return [roleMention, actorMention].filter(Boolean).join(' ').trim();
}

function trimMessage(text = '') {
  return text.split('\n')[0].trim();
}

function formatPullRequest(event, payload, roleMention, actor) {
  const pr = payload.pull_request;
  if (!pr) {
    return null;
  }

  let action = payload.action || 'mise a jour';
  if (action === 'closed' && pr.merged) {
    action = 'merge';
  }

  const actionLabelMap = {
    opened: 'a ouvert',
    edited: 'a modifie',
    closed: pr.merged ? 'a merge' : 'a ferme',
    reopened: 'a re-ouvert',
    assigned: 'a assigne',
    unassigned: 'a desassigne',
    ready_for_review: 'a marque en pret',
    converted_to_draft: 'a repasse en draft',
    synchronize: 'a mis a jour',
    merge: 'a merge',
    review_requested: 'a demande une review',
    review_request_removed: 'a retire une review',
  };

  const actionText = actionLabelMap[action] || `a ${action}`;
  const prLink = `[${pr.title} (#${pr.number})](${pr.html_url})`;
  const branchText = `\`${pr.head?.ref}\` -> \`${pr.base?.ref}\``;
  const prefix = buildPrefix(roleMention, actor.mention);
  const content = `${prefix} ${actionText} la PR ${prLink}`.trim();

  const embed = {
    color: pr.merged ? 0x6f42c1 : action === 'closed' ? 0xcb2431 : 0x28a745,
    title: `${pr.title} (#${pr.number})`,
    url: pr.html_url,
    description: `${actor.label} ${actionText} ${prLink}`,
    fields: [
      { name: 'Depot', value: payload.repository?.full_name || 'Repository', inline: true },
      { name: 'Branches', value: branchText, inline: true },
      {
        name: 'Etat',
        value: pr.state === 'open' ? 'Ouverte' : pr.merged ? 'Mergee' : 'Fermee',
        inline: true,
      },
    ],
    footer: { text: `GitHub PR ${payload.repository?.name || ''}`.trim() },
    timestamp: pr.updated_at || pr.created_at,
  };

  return { content, embeds: [embed] };
}

function formatPush(event, payload, roleMention, actor) {
  const commits = payload.commits || [];
  const ref = payload.ref || '';
  const branch = ref.split('/').pop();
  const repoName = payload.repository?.full_name || 'Repository';

  const prefix = buildPrefix(roleMention, actor.mention);
  const content = `${prefix} a pousse ${commits.length} commit(s) sur \`${branch}\` (${repoName}).`.trim();

  const commitLines = commits.slice(0, 5).map((commit) => {
    const authorProfile = buildActorProfile(commit.author || {});
    const shortSha = commit.id ? commit.id.slice(0, 7) : '';
    const message = trimMessage(commit.message || 'Commit');
    return `[\`${shortSha}\`](${commit.url}) ${message} — ${authorProfile.label}`;
  });
  if (commits.length > 5) {
    commitLines.push(`… et ${commits.length - 5} autre(s) commit(s).`);
  }

  const embed = {
    color: 0x0366d6,
    title: `${repoName} · ${branch}`,
    url: payload.compare || payload.repository?.html_url,
    description: commitLines.join('\n') || 'Aucun commit detaille.',
    footer: { text: `Push GitHub (${branch})` },
    timestamp: payload.head_commit?.timestamp || new Date().toISOString(),
  };

  return { content, embeds: [embed] };
}

function formatIssueComment(event, payload, roleMention, actor) {
  const issue = payload.issue;
  const comment = payload.comment;
  if (!issue || !comment) {
    return null;
  }
  const isPullRequest = Boolean(issue.pull_request);
  const targetLabel = isPullRequest ? 'la PR' : "l'issue";
  const prefix = buildPrefix(roleMention, actor.mention);
  const issueLink = `[${issue.title} (#${issue.number})](${issue.html_url})`;
  const content = `${prefix} a commente ${targetLabel} ${issueLink}.`.trim();

  const embed = {
    color: 0x0052cc,
    title: `${issue.title} (#${issue.number})`,
    url: comment.html_url,
    description: comment.body?.slice(0, 400) || '(commentaire vide)',
    footer: { text: `Commentaire GitHub · ${payload.repository?.full_name || ''}`.trim() },
    timestamp: comment.created_at,
  };

  return { content, embeds: [embed] };
}

function formatCommitComment(event, payload, roleMention, actor) {
  const comment = payload.comment;
  if (!comment) {
    return null;
  }
  const commitId = comment.commit_id ? comment.commit_id.slice(0, 7) : '';
  const prefix = buildPrefix(roleMention, actor.mention);
  const content = `${prefix} a commente le commit \`${commitId}\` dans ${payload.repository?.full_name || 'Repository'}.`.trim();
  const embed = {
    color: 0x24292e,
    title: `Commentaire sur ${commitId}`,
    url: comment.html_url,
    description: comment.body?.slice(0, 400) || '(commentaire vide)',
    footer: { text: `Commit comment · ${payload.repository?.full_name || ''}`.trim() },
    timestamp: comment.created_at,
  };
  return { content, embeds: [embed] };
}

function formatPullRequestReview(event, payload, roleMention, actor) {
  const review = payload.review;
  const pr = payload.pull_request;
  if (!review || !pr) {
    return null;
  }
  const stateMap = {
    approved: 'a approuve',
    commented: 'a laisse un avis',
    changes_requested: 'a demande des changements',
  };
  const verb = stateMap[review.state] || `a laisse une review (${review.state})`;
  const prefix = buildPrefix(roleMention, actor.mention);
  const prLink = `[${pr.title} (#${pr.number})](${pr.html_url})`;
  const content = `${prefix} ${verb} ${prLink}.`.trim();

  const embed = {
    color: review.state === 'approved' ? 0x2cbe4e : review.state === 'changes_requested' ? 0xcb2431 : 0x0052cc,
    title: `Review · ${pr.title}`,
    url: review.html_url || pr.html_url,
    description: review.body?.slice(0, 400) || '(review sans commentaire)',
    footer: { text: `Review GitHub · ${payload.repository?.full_name || ''}`.trim() },
    timestamp: review.submitted_at || review.submitted || review.created_at,
  };

  return { content, embeds: [embed] };
}

function formatDelete(event, payload, roleMention, actor) {
  const refType = payload.ref_type || 'reference';
  const ref = payload.ref;
  const repo = payload.repository?.full_name || 'Repository';
  const prefix = buildPrefix(roleMention, actor.mention);
  const content = `${prefix} a supprime ${refType} \`${ref}\` dans ${repo}.`.trim();

  const embed = {
    color: 0xcb2431,
    title: `Suppression de ${ref}`,
    description: `${actor.label} a supprime ${refType} \`${ref}\``,
    footer: { text: `Delete GitHub · ${repo}` },
    timestamp: payload.repository?.pushed_at ? new Date(payload.repository.pushed_at * 1000).toISOString() : new Date().toISOString(),
  };

  return { content, embeds: [embed] };
}

function formatGithubEvent(eventName, payload, roleMention) {
  const actor =
    payload.sender ||
    payload.pusher ||
    payload.comment?.user ||
    payload.review?.user ||
    payload.pull_request?.user ||
    null;
  const actorProfile = buildActorProfile(actor);

  switch (eventName) {
    case 'pull_request':
      return formatPullRequest(eventName, payload, roleMention, actorProfile);
    case 'push':
      return formatPush(eventName, payload, roleMention, actorProfile);
    case 'issue_comment':
      return formatIssueComment(eventName, payload, roleMention, actorProfile);
    case 'pull_request_review_comment':
    case 'commit_comment':
      return formatCommitComment(eventName, payload, roleMention, actorProfile);
    case 'pull_request_review':
      return formatPullRequestReview(eventName, payload, roleMention, actorProfile);
    case 'delete':
      return formatDelete(eventName, payload, roleMention, actorProfile);
    default:
      return null;
  }
}

module.exports = {
  formatGithubEvent,
};
