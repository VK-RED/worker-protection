import { MetadataService } from "@aws-sdk/ec2-metadata-service";
import { AutoScalingClient, SetInstanceProtectionCommand } from "@aws-sdk/client-auto-scaling"; // ES Modules import

const getProtectionCommand = (instanceId: string, protect: boolean) => {
  const protectionCommand = new SetInstanceProtectionCommand({
    AutoScalingGroupName: "test-asg",
    InstanceIds: [instanceId],
    ProtectedFromScaleIn: protect,
  });
  return protectionCommand;
}

async function main() {

  const metadataService = new MetadataService({});
  const instanceId = await metadataService.request("/latest/meta-data/instance-id", {});

  const asClient = new AutoScalingClient();

  // 0 => Protected, 1 => Not Protected
  const protectedInstance = process.env.INSTANCE_PROTECTION ? Number(process.env.INSTANCE_PROTECTION) : 1;
  const command = getProtectionCommand(instanceId, protectedInstance === 0);

  await asClient.send(command);

  while (true) {
    console.log("Worker running");
    await new Promise(res => setTimeout(res, 2 * 1000));
  }
}

main();
