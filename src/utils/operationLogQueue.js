const OperationLog = require('../models/OperationLog');
const { logger } = require('../config');

/**
 * 日志写入队列：
 * - push() 把日志对象放入内存队列，立即返回，不阻塞主请求
 * - 满足 BATCH_SIZE 或每 FLUSH_INTERVAL_MS 触发一次 insertMany 批量写入
 * - 进程退出时同步 flush
 * - 写入失败仅记录日志，不抛出，避免影响业务
 */

const BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 2000;
const MAX_QUEUE_SIZE = 1000; // 超过则丢弃最早的，防止内存爆炸

let queue = [];
let timer = null;
let flushing = false;

const flush = async () => {
  if (flushing) return;
  if (queue.length === 0) return;
  flushing = true;
  const batch = queue;
  queue = [];
  try {
    await OperationLog.insertMany(batch, { ordered: false });
  } catch (err) {
    logger.error('Failed to flush operation logs:', err);
  } finally {
    flushing = false;
  }
};

const scheduleFlush = () => {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
};

const push = (doc) => {
  if (queue.length >= MAX_QUEUE_SIZE) {
    queue.shift(); // 丢弃最早一条
    logger.warn('OperationLog queue overflow, dropping earliest entry');
  }
  queue.push(doc);
  if (queue.length >= BATCH_SIZE) {
    if (timer) { clearTimeout(timer); timer = null; }
    flush();
  } else {
    scheduleFlush();
  }
};

// 进程退出时尽量 flush（注意：异步 flush 不一定能在 SIGINT 下完整完成）
const installExitHooks = () => {
  const handler = async () => {
    try { await flush(); } catch {}
  };
  process.once('SIGINT', handler);
  process.once('SIGTERM', handler);
  process.once('beforeExit', handler);
};
installExitHooks();

module.exports = { push, flush };
