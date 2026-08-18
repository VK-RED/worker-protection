const processTaskWithTimeout = async () => {
  let state = {
    extend: true
  };
  extendTimeout(state);
  await processTask(state);
}

const extendTimeout = async (state: { extend: boolean }) => {
  while (state.extend) {
    console.log("call to increase timeout called via aws api for 10 secs");
    console.log("shouldExtend: ", state.extend);
    // wait for 5 secs 
    await new Promise(res => setTimeout(res, 5 * 1000))
  }
}

const processTask = async (state: { extend: boolean }) => {
  console.log("Processing Task");
  await new Promise(res => setTimeout(res, 30 * 1000));
  console.log("setting shouldExtend to false")
  state.extend = false;
}

processTaskWithTimeout();

/*
 *
 * So I am running a fleet of workers, each worker will pick a job from a queue and run the process the job,
 * the job processing may take 3 to 5 minutes. I am thinking of using aws auto scaling gruops.
 * Where we can scale out and scale in.
 * Before processing a job I will set InstanceProtection to true and process the job and then set InstanceProtection to false,
 * but even then when scaling in, the worker might get killed in mid way when processing a job.
 *
 import {
  AutoScalingClient,
  DescribeAutoScalingInstancesCommand,
  CompleteLifecycleActionCommand,
  RecordLifecycleActionHeartbeatCommand,
} from "@aws-sdk/client-auto-scaling";

const asg = new AutoScalingClient({});
const ASG_NAME = process.env.ASG_NAME!;
const HOOK_NAME = process.env.LIFECYCLE_HOOK_NAME!;

const IMDS_BASE = "http://169.254.169.254/latest";

async function getInstanceId(): Promise<string> {
  const tokenRes = await fetch(`${IMDS_BASE}/api/token`, {
    method: "PUT",
    headers: { "X-aws-ec2-metadata-token-ttl-seconds": "21600" },
  });
  const token = await tokenRes.text();

  const idRes = await fetch(`${IMDS_BASE}/meta-data/instance-id`, {
    headers: { "X-aws-ec2-metadata-token": token },
  });
  return idRes.text();
}

async function getLifecycleState(instanceId: string): Promise<string | undefined> {
  const resp = await asg.send(
    new DescribeAutoScalingInstancesCommand({ InstanceIds: [instanceId] })
  );
  return resp.AutoScalingInstances?.[0]?.LifecycleState;
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

async function sendHeartbeat(instanceId: string): Promise<void> {
  await asg.send(
    new RecordLifecycleActionHeartbeatCommand({
      LifecycleHookName: HOOK_NAME,
      AutoScalingGroupName: ASG_NAME,
      InstanceId: instanceId,
    })
  );
}

async function main() {
  const instanceId = await getInstanceId();
  let terminationHandled = false;

  while (true) {
    const state = await getLifecycleState(instanceId);

    if (state === "Terminating:Wait") {
      // Don't pick up new work — finish what's in flight, then bail out.
      await finishCurrentJobIfAny();

      if (!terminationHandled) {
        await completeTermination(instanceId);
        terminationHandled = true;
      }
      break; // instance will be terminated shortly after this
    }

    if (state === "InService") {
      const job = await pollQueue();
      if (job) {
        await processJobWithHeartbeat(instanceId, job);
      }
    }

    await sleep(5000); // poll interval
  }
}

// Wraps job processing with a periodic heartbeat in case a job
// runs long enough to approach the hook's timeout.
async function processJobWithHeartbeat(instanceId: string, job: unknown) {
  const heartbeatInterval = setInterval(() => {
    sendHeartbeat(instanceId).catch(console.error);
  }, 15 * 60 * 1000); // e.g. every 15 min, well under a 1hr timeout

  try {
    await processJob(job);
  } finally {
    clearInterval(heartbeatInterval);
  }
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
 */
