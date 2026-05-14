export const getCorrectedAxis = (rad, x, y) =>
{
    const rotationRad = rad;
    const angle = -rotationRad; 
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const xPos = x;
    const yPos = y;
    const correctedX = xPos * cos - yPos * sin;
    const correctedY = xPos * sin + yPos * cos;

    return {x: correctedX, y: correctedY};
};
