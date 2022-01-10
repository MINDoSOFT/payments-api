import express from 'express';
import { Send } from 'express-serve-static-core';

export interface TypedResponseBody<ResBody> extends express.Response {
    json: Send<ResBody, this>
}
