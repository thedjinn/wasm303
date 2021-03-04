use crate::kernel::ANTI_DENORMAL;
use super::BiQuad;

impl BiQuad {
    pub fn bypass() -> Self {
        BiQuad {
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            a1: 0.0,
            a2: 0.0,
            b0: 1.0,
            b1: 0.0,
            b2: 0.0
        }
    }

    pub fn render(&mut self, x0: f32) -> f32 {
        let y1 = self.b0 * x0 + self.b1 * self.x1 + self.b2 * self.x2 - self.a1 * self.y1 - self.a2 * self.y2 + ANTI_DENORMAL;

        self.x2 = self.x1;
        self.x1 = x0;
        self.y2 = self.y1;
        self.y1 = y1;

        y1
    }
}
