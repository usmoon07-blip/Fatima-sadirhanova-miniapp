/* Kursga kirish: har bir o'quvchiga faqat o'zi uchun, bir martalik havola.
   Havola "qo'shilish so'rovi" (join request) rejimida yaratiladi:
   - so'rovni faqat havola egasi yuborsa bot qabul qiladi, begonalarniki rad etiladi;
   - qabul qilingandan keyin havola darhol bekor qilinadi — qayta bosganda ishlamaydi. */
const { prisma } = require('../database/connection');
const { bot } = require('../core/bot');

async function findAccess(userId, courseId) {
  return prisma.courseAccess.findUnique({ where: { userId_courseId: { userId, courseId } } });
}

/** O'quvchi uchun kirish havolasini qaytaradi (bo'lmasa yaratadi). */
async function ensureAccess(user, course) {
  if (!course.channelId) {
    return course.accessLink ? { link: course.accessLink, used: false, legacy: true } : null;
  }
  let access = await findAccess(user.id, course.id);
  if (access && access.channelId === course.channelId) {
    return { link: access.usedAt ? null : access.inviteLink, used: Boolean(access.usedAt) };
  }
  if (!bot) throw new Error('Bot ishlamayapti');

  const invite = await bot.api.createChatInviteLink(course.channelId, {
    name: `u${user.id}-c${course.id}`.slice(0, 32),
    creates_join_request: true,
  });
  if (access) {
    access = await prisma.courseAccess.update({
      where: { id: access.id },
      data: { channelId: course.channelId, inviteLink: invite.invite_link, usedAt: null },
    });
  } else {
    access = await prisma.courseAccess.create({
      data: { userId: user.id, courseId: course.id, channelId: course.channelId, inviteLink: invite.invite_link },
    });
  }
  return { link: access.inviteLink, used: false };
}

/** Mini App uchun: o'quvchining kurslari bo'yicha kirish holati (havola yaratmaydi) */
async function accessMap(userId) {
  const rows = await prisma.courseAccess.findMany({ where: { userId } });
  return new Map(rows.map((r) => [r.courseId, r]));
}

/** Kanalga qo'shilish so'rovi kelganda: faqat havola egasini qabul qiladi */
async function decideJoinRequest(request) {
  const link = request.invite_link?.invite_link;
  const chatId = String(request.chat.id);
  const access = link
    ? await prisma.courseAccess.findFirst({ where: { inviteLink: link, channelId: chatId }, include: { user: true, course: true } })
    : null;

  const isOwner = access && access.user.telegramId === String(request.from.id);
  if (!isOwner || access.usedAt) {
    await bot.api.declineChatJoinRequest(chatId, request.from.id).catch(() => {});
    return { approved: false, access };
  }
  await bot.api.approveChatJoinRequest(chatId, request.from.id);
  await prisma.courseAccess.update({ where: { id: access.id }, data: { usedAt: new Date() } });
  await bot.api.revokeChatInviteLink(chatId, link).catch(() => {});
  return { approved: true, access };
}

/** Admin: o'quvchiga yangi havola berish (masalan, kanaldan chiqib ketgan bo'lsa) */
async function resetAccess(userId, courseId) {
  const access = await findAccess(userId, courseId);
  if (!access) return;
  if (bot && !access.usedAt) await bot.api.revokeChatInviteLink(access.channelId, access.inviteLink).catch(() => {});
  await prisma.courseAccess.delete({ where: { id: access.id } });
}

module.exports = { ensureAccess, accessMap, decideJoinRequest, resetAccess };
