/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: MIT
 */

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { onParentNavigation, onSelfNavigation } from '../core.js';

/**
 * This component is used to sync the location of the parent and child frames.
 *
 * Requires react-router-dom
 */
export const LocationSync = () => {
    if (!useNavigate) {
        throw new Error('LocationSync requires react-router-dom v6 or higher');
    }
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        //Handle parent navigation events
        return onParentNavigation((path: string) => navigate(path, { replace: true }));
    }, []);

    useEffect(() => {
        //Handle self navigation events
        onSelfNavigation();
    }, [location]);
    return null;
};
