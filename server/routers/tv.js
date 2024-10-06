import { Router } from 'express';
import { httpError, httpCodes, httpMessages } from '../modules/http-manager.js';
import { Logger } from '../modules/logger.js';
import { commentService } from '../modules/services/data.js';
import { utility } from '../modules/utility.js';
const { logger } = Logger('view');

const publicRouter = Router();
const publicPath = '/api/tv';

/**
 * Get comments
 */
publicRouter.get('/comments/:videoId', async (req, res, next) => {
  try {
    const { skip = '0', limit = '10' } = req.query;
    const { videoId } = req.params;
    logger.info(`Get comments for video ${videoId}`);
    const data = await commentService.queryComments({ target_id: videoId }, { skip: utility.parseInt(skip), limit: utility.parseInt(limit, 10), sort: [ ['created_time', -1] ] });
    return res.send({ comments: data });
  }
  catch(error) {
    return next(httpError(httpCodes.BAD_REQUEST, httpMessages.BAD_REQUEST, error));
  }
});

/**
 * Create comments
 */
publicRouter.post('/comments/:videoId', async (req, res, next) => {
  try {
    const { videoId } = req.params;
    /** @type {{ content: string }} */
    const { content } = req.body;
    if(content) {
      const comment = content.trim();
      logger.info(`Create comment for video ${videoId}:\n\r${comment}`);

      if(comment.length > 2) {
        const data = await commentService.createComment(req.clientId, videoId, comment);
        return res.send({ comment: data });
      }
    }
    throw httpError(httpCodes.BAD_REQUEST, httpMessages.BAD_REQUEST, new Error('评论内容不能为空'));
  }
  catch(error) {
    return next(httpError(httpCodes.SYSTEM_FAILURE, httpMessages.SYSTEM_FAILURE, error));
  }
});

export {
  publicPath,
  publicRouter
};
