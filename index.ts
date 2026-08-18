import { MetadataService } from "@aws-sdk/ec2-metadata-service";
import { AutoScalingClient, CompleteLifecycleActionCommand, DescribeAutoScalingInstancesCommand, SetInstanceProtectionCommand } from "@aws-sdk/client-auto-scaling"; // ES Modules import

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error("AWS CREDS NOT SET")
}

const asg = new AutoScalingClient();
const HOOK_NAME = "test-termination-hook";
const ASG_NAME = "test-asg";

const getProtectionCommand = (instanceId: string, protect: boolean) => {
  const protectionCommand = new SetInstanceProtectionCommand({
    AutoScalingGroupName: ASG_NAME,
    InstanceIds: [instanceId],
    ProtectedFromScaleIn: protect,
  });
  return protectionCommand;
}

const getInstanceState = async (instanceId: string) => {
  const resp = await asg.send(
    new DescribeAutoScalingInstancesCommand({ InstanceIds: [instanceId] })
  );
  return resp.AutoScalingInstances?.[0]?.LifecycleState;
}

const processJob = async () => {

  let secs = 3 * 60;

  while (secs > 0) {
    console.log("Worker running");
    await new Promise(res => setTimeout(res, 2 * 1000));
    secs -= 2;
  }
}

async function completeTermination(instanceId: string): Promise<void> {

  await asg.send(
    new CompleteLifecycleActionCommand({
      LifecycleHookName: HOOK_NAME,
      AutoScalingGroupName: ASG_NAME,
      LifecycleActionResult: "CONTINUE",
      InstanceId: instanceId,
    })
  );
}

async function main() {

  console.log("Worker started");

  const metadataService = new MetadataService({});
  const instanceId = await metadataService.request("/latest/meta-data/instance-id", {});

  // enable scale in protection
  //TODO: Edit this to play around 
  const enableCommand = getProtectionCommand(instanceId, true);
  await asg.send(enableCommand);

  console.log("enabled scale-in protection");

  await processJob();

  // disable scale in protection
  const disableCommand = getProtectionCommand(instanceId, false);
  await asg.send(disableCommand);

  console.log("disabled scale-in protection");

  const state = await getInstanceState(instanceId);

  if (state === "Terminating:Wait") {
    completeTermination(instanceId);
  }
  else {
    console.log("State is not Terminating:Wait instead it is: ", state);
  }

  while (true) { }
}

main();
