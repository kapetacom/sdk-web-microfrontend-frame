import React from 'react';
import { BrowserRouter, BrowserRouterProps } from 'react-router-dom';
import { getBasePath } from '../core.js';
import { LocationSync } from './LocationSync.js';

export interface FrameRouterProps extends Omit<BrowserRouterProps, 'basename'> {}
/**
 * Use this component in place of BrowserRouter to sync the location of the parent and child frames.
 *
 * Requires react-router-dom
 */
export const FrameRouter = (props: FrameRouterProps) => {
    return (
        <BrowserRouter basename={getBasePath()} {...props}>
            {props.children}
            <LocationSync />
        </BrowserRouter>
    );
};
