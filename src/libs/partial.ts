import { Request, Response } from 'express';
import { OutgoingHttpHeaders } from 'http';
import { ReadableStreamBuffer } from 'stream-buffers';
import { IFileStats } from '../../types/file';
import { UFS } from './file/read';

export class Partial {
  private readonly ufs: UFS;

  public constructor(ufs: UFS) {
    this.ufs = ufs;
  }
  public async resolve(request: Request, response: Response): Promise<void> {
    if (request.method !== 'GET') {
      this.sendResponse(response, 405, { Allow: 'GET' }, undefined);
    }

    const filename: string = request.params.key.split('.')[0];

    // Check if file exists. If not, will return the 404 'Not Found'.
    const stat: IFileStats = await this.ufs.stats(filename);
    if (!stat) {
      this.sendResponse(response, 404, undefined, undefined);

      return;
    }

    const responseHeaders: { [key: string]: any } = {};
    const rangeRequest: IRangeRequest = this.readRangeHeader(
      request.headers.range,
      stat.size
    );
    const readable: ReadableStreamBuffer = new ReadableStreamBuffer({
      chunkSize: 5 * 1024,
      frequency: 10
    });
    // If 'Range' header exists, we will parse it with Regular Expression.
    if (rangeRequest === undefined) {
      responseHeaders['Content-Type'] = stat.mime;
      responseHeaders['Content-Length'] = stat.size; // File size.
      responseHeaders['Accept-Ranges'] = 'bytes';

      //  If not, will return file directly.
      this.sendResponse(response, 200, responseHeaders, readable);
      this.ufs.read(filename, 0, stat.size, readable);

      return;
    }

    const start: number = rangeRequest.Start;
    const end: number = rangeRequest.End;

    // If the range can't be fulfilled.
    if (start >= stat.size || end >= stat.size) {
      // Indicate the acceptable range.
      responseHeaders['Content-Range'] = 'bytes */' + stat.size.toString(); // File size.

      // Return the 416 'Requested Range Not Satisfiable'.
      this.sendResponse(response, 416, responseHeaders, undefined);

      return;
    }

    // Indicate the current range.
    responseHeaders['Content-Range'] =
      'bytes ' + start.toString() + '-' + end.toString() + '/' + stat.size.toString();
    responseHeaders['Content-Length'] = start === end ? 0 : end - start + 1;
    responseHeaders['Content-Type'] = stat.mime;
    responseHeaders['Accept-Ranges'] = 'bytes';
    responseHeaders['Cache-Control'] = 'no-cache';

    // Return the 206 'Partial Content'.
    this.sendResponse(response, 206, responseHeaders, readable);
    await this.ufs.read(filename, start, end - start + 1, readable);

    return;
  }

  public sendResponse(
    response: Response,
    responseStatus: number,
    responseHeaders: OutgoingHttpHeaders,
    readable: ReadableStreamBuffer
  ): void {
    response.writeHead(responseStatus, responseHeaders);

    if (!readable) {
      response.end();
    }
    readable.on('data', (chunk: Buffer): void => {
      response.write(chunk, 'binary');
    });
    readable.on('end', (): void => {
      response.end();
    });
  }
  public readRangeHeader(range: string, totalLength: number): IRangeRequest {
    /*
     * Example of the method 'split' with regular expression.
     *
     * Input: bytes=100-200
     * Output: [null, 100, 200, null]
     *
     * Input: bytes=-200
     * Output: [null, null, 200, null]
     */

    if (!range || range.length === 0) {
      return undefined;
    }

    const array: string[] = range.split(/bytes=([0-9]*)-([0-9]*)/);
    const start: number = parseInt(array[1], 10);
    const end: number = parseInt(array[2], 10);
    const result: IRangeRequest = {
      Start: isNaN(start) ? 0 : start,
      End: isNaN(end) ? totalLength - 1 : end
    };

    if (!isNaN(start) && isNaN(end)) {
      result.Start = start;
      result.End = totalLength - 1;
    }

    if (isNaN(start) && !isNaN(end)) {
      result.Start = totalLength - end;
      result.End = totalLength - 1;
    }

    return result;
  }
}

export interface IRangeRequest {
  Start: number;
  End: number;
}
