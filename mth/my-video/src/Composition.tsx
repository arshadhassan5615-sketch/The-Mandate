import {Composition} from "remotion";
import {LinearSystems} from "./LinearSystems";

export const MyComposition = () => {
  return (
    <Composition
      id="LinearSystems"
      component={LinearSystems}
      durationInFrames={3270}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
