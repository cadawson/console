/* Copyright Contributors to the Open Cluster Management project */

import { createAcmIcon } from './createAcmIcon'

export const BrokenLinkIcon = createAcmIcon({
    xOffset: 0,
    yOffset: 0,
    width: 32,
    height: 32,
    svgPaths: (
        <g fill="var(--pf-global--Color--200)">
            <path d="M5 3.59H7V8.42H5z" transform="rotate(-45.01 5.996 6.005)"></path>
            <path d="M25 23.58H27V28.409999999999997H25z" transform="rotate(-44.99 25.995 25.999)"></path>
            <path d="M11 2H13V6H11zM2 11H6V13H2zM26 19H30V21H26zM19 26H21V30H19zM16.58 21.07l-3.71 3.72a4 4 0 11-5.66-5.66l3.72-3.72L9.51 14 5.8 17.72a6 6 0 00-.06 8.54A6 6 0 0010 28a6.07 6.07 0 004.32-1.8L18 22.49zM15.41 10.93l3.72-3.72a4 4 0 115.66 5.66l-3.72 3.72L22.49 18l3.71-3.72a6 6 0 00.06-8.54A6 6 0 0022 4a6.07 6.07 0 00-4.32 1.8L14 9.51z"></path>
        </g>
    ),
})

export default BrokenLinkIcon
