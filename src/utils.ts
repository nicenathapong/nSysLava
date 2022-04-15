import type { nSysNode } from "./lib/Node";

export const random = (list: nSysNode[]): nSysNode => {
    var { floor, random } = Math;
    const { length } = list;
    return list[floor(random()*length)];
}