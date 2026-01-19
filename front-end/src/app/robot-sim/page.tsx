import { RobotArmScene } from "@/features/robot-sim/components/RobotArmScene";
import { ComponentDrawer } from "@/features/robot-sim/components/ComponentDrawer";
import { ControlDrawer } from "@/features/robot-sim/components/ControlDrawer";

export default function RobotSimPage() {
    return (
        <main className="flex h-screen flex-col bg-[#0b0f14] text-white">
            <header className="border-b border-white/10 px-6 py-4">
                <h1 className="text-xl font-semibold tracking-tight">Six-Axis Robot Arm</h1>
                <p className="mt-1 text-sm text-white/70">
                    High-fidelity industrial manipulator preview
                </p>
            </header>
            <section className="relative flex-1 overflow-hidden">
                <ComponentDrawer />
                <ControlDrawer />
                <RobotArmScene />
            </section>
        </main>
    );
}
