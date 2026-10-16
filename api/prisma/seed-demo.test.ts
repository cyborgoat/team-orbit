import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { demoId, seedDatabase } from './seed-demo';

async function main() {
  const directory = mkdtempSync(join(tmpdir(), 'orbit-seed-test-'));
  const url = `file:${join(directory, 'seed.db')}`;
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    execFileSync(
      process.execPath,
      [resolve('node_modules/prisma/build/index.js'), 'migrate', 'deploy'],
      {
        cwd: resolve('.'),
        env: { ...process.env, DATABASE_URL: url },
        stdio: 'pipe',
      },
    );
    const now = new Date('2026-10-16T04:00:00Z');
    const expected = {
      User: 12,
      Event: 6,
      Announcement: 6,
      News: 8,
      BlogPost: 8,
      ForumPost: 10,
      ForumComment: 30,
      ForumPostVote: 30,
      ForumCommentVote: 60,
      Notification: 16,
      NotificationRead: 24,
    };
    const publicBaseUrl = 'https://orbit.example.test';
    const summary = await seedDatabase(prisma, now, publicBaseUrl);
    for (const [model, count] of Object.entries(expected)) {
      assert.equal(summary[model].created, count, `${model} creation count`);
      const rows = await prisma.$queryRawUnsafe<unknown[]>(
        `SELECT * FROM "${model}"`,
      );
      assert.equal(rows.length, count, `${model} database count`);
    }
    assert.deepEqual(
      await prisma.$queryRawUnsafe('PRAGMA foreign_key_check'),
      [],
    );
    const events = await prisma.event.findMany();
    assert(events.some((event) => event.endAt < now));
    assert(events.some((event) => event.startAt > now));
    assert(events.every((event) => event.startAt < event.endAt));
    const users = await prisma.user.findMany();
    assert.equal(new Set(users.map((user) => user.status)).size, 5);
    assert.equal(new Set(users.map((user) => user.role)).size, 3);
    assert(users.some((user) => user.email === null));
    for (const post of await prisma.forumPost.findMany({
      include: { votes: true },
    })) {
      assert.equal(
        post.score,
        post.votes.reduce((sum, vote) => sum + vote.value, 0),
      );
    }
    const comments = await prisma.forumComment.findMany({
      include: { votes: true, parent: true },
    });
    assert.equal(comments.filter((comment) => comment.parentId).length, 10);
    for (const comment of comments) {
      assert.equal(
        comment.score,
        comment.votes.reduce((sum, vote) => sum + vote.value, 0),
      );
      if (comment.parent) {
        assert.equal(comment.parent.parentId, null);
        assert.equal(comment.parent.postId, comment.postId);
      }
    }
    const resourceModels = {
      event: 'Event',
      announcement: 'Announcement',
      news: 'News',
      blog: 'BlogPost',
      forum: 'ForumPost',
    };
    for (const notification of await prisma.notification.findMany()) {
      const model =
        resourceModels[
          notification.resourceType as keyof typeof resourceModels
        ];
      assert(model);
      const rows = await prisma.$queryRawUnsafe<unknown[]>(
        `SELECT id FROM "${model}" WHERE id = ?`,
        notification.resourceId,
      );
      assert.equal(rows.length, 1);
    }
    for (const username of ['superadmin', 'admin', 'member']) {
      const user = users.find((item) => item.username === username)!;
      assert.equal(
        await prisma.notificationRead.count({ where: { userId: user.id } }),
        8,
      );
    }
    const formula = await prisma.blogPost.findUniqueOrThrow({
      where: { id: demoId('blog:1') },
    });
    assert(formula.content.includes(String.raw`\frac{n}{d}`));
    assert(formula.content.includes(String.raw`\begin{aligned}`));

    // Simulate real edits, a removed vote, a renamed account, and unrelated content.
    const member = await prisma.user.findUniqueOrThrow({
      where: { username: 'member' },
    });
    await prisma.user.update({
      where: { id: member.id },
      data: {
        fullName: 'Edited name',
        email: null,
        passwordHash: 'edited-hash',
        role: 'ADMIN',
      },
    });
    await prisma.user.update({
      where: { username: 'lina' },
      data: { username: 'lina-renamed' },
    });
    await prisma.news.update({
      where: { id: demoId('news:0') },
      data: { title: 'Edited title', content: 'Edited content' },
    });
    await prisma.forumPostVote.delete({
      where: { id: demoId('post-vote:0:0') },
    });
    await prisma.forumPost.update({
      where: { id: demoId('forum:0') },
      data: { score: 0 },
    });
    await prisma.forumComment.update({
      where: { id: demoId('comment:0:2') },
      data: { content: 'Edited reply' },
    });
    await prisma.announcement.create({
      data: {
        title: 'Unrelated announcement',
        description: 'Keep this',
        authorId: member.id,
      },
    });
    const snapshot = async () =>
      Promise.all(
        Object.keys(expected).map((model) =>
          prisma.$queryRawUnsafe(`SELECT * FROM "${model}" ORDER BY id`),
        ),
      );
    const before = await snapshot();
    const rerun = await seedDatabase(
      prisma,
      new Date('2026-11-01T00:00:00Z'),
      publicBaseUrl,
    );
    assert(Object.values(rerun).every((counts) => counts.created === 0));
    assert.deepEqual(
      await snapshot(),
      before,
      'Rerun must preserve every existing row',
    );
    const launch = await prisma.news.findUniqueOrThrow({
      where: { id: demoId('news:0') },
    });
    assert.equal(launch.coverImageUrl, `${publicBaseUrl}/demo/orbit.svg`);

    // Repair a legacy seed while preserving edited prose, titles, and custom URLs.
    const legacy =
      'Edited intro\n\n[![Launch](/demo/orbit.svg "Title")](/demo/orbit.svg)\n\n![Custom](https://custom.example/demo/orbit.svg)';
    await prisma.news.update({
      where: { id: launch.id },
      data: { content: legacy, coverImageUrl: '/demo/orbit.svg' },
    });
    await prisma.user.update({
      where: { id: demoId('user:maya') },
      data: { avatarUrl: '/demo/orbit.svg' },
    });
    await prisma.forumComment.update({
      where: { id: demoId('comment:4:1') },
      data: { content: 'Edited reply\n\n![Workshop](/demo/workshop.svg)' },
    });
    const repair = await seedDatabase(prisma, now, publicBaseUrl + '/');
    assert.equal(repair.News.repaired, 1);
    const fixed = await prisma.news.findUniqueOrThrow({
      where: { id: launch.id },
    });
    assert.equal(fixed.title, 'Edited title');
    assert.equal(fixed.coverImageUrl, `${publicBaseUrl}/demo/orbit.svg`);
    assert.equal(
      fixed.content,
      legacy.replaceAll(
        '](/demo/orbit.svg',
        `](${publicBaseUrl}/demo/orbit.svg`,
      ),
    );
    assert.equal(
      (
        await prisma.user.findUniqueOrThrow({
          where: { id: demoId('user:maya') },
        })
      ).avatarUrl,
      `${publicBaseUrl}/demo/orbit.svg`,
    );
    assert.equal(
      (
        await prisma.forumComment.findUniqueOrThrow({
          where: { id: demoId('comment:4:1') },
        })
      ).content,
      `Edited reply\n\n![Workshop](${publicBaseUrl}/demo/workshop.svg)`,
    );
    const afterRepair = await snapshot();
    await seedDatabase(prisma, now, publicBaseUrl);
    assert.deepEqual(await snapshot(), afterRepair);
    console.log(
      'Seed checks passed: counts, relationships, scores, Markdown, and non-destructive reruns.',
    );
  } finally {
    await prisma.$disconnect();
    rmSync(directory, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
