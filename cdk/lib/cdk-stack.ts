import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a secret for the Spotify client ID
    const clientId = new secretsmanager.Secret(this, 'SpotifyClientId', {
      secretName: 'spotify-client-id',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ CLIENT_ID: 'default-client-id' }),
        generateStringKey: 'CLIENT_ID',
      },
    });

    // Create a secret for the Spotify client secret
    const clientSecret = new secretsmanager.Secret(this, 'SpotifyClientSecret', {
      secretName: 'spotify-client-secret',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ CLIENT_SECRET: 'default-client-secret' }),
        generateStringKey: 'CLIENT_SECRET',
      },
    });

    // Create a VPC
    const vpc = new ec2.Vpc(this, 'TunedInVPC', {
      maxAzs: 2
    });

    // Create an ECS cluster
    const cluster = new ecs.Cluster(this, 'TunedInCluster', {
      vpc: vpc
    });

    // Add capacity to the cluster
    const autoScalingGroup = cluster.addCapacity('DefaultAutoScalingGroup', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      desiredCapacity: 1,
      maxCapacity: 1, // Limit to 1 instance for free tier
      minCapacity: 1,
    });

    // Create a task definition
    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'TunedInBackendTask');
    const container = taskDefinition.addContainer('tunedInBackend', {
      image: ecs.ContainerImage.fromRegistry("tunedindev:tunedinbackend"),
      memoryLimitMiB: 512,
      cpu: 256,
      portMappings: [{ containerPort: 8080 }],
      secrets: {
        SPOTIFY_CLIENT_ID: ecs.Secret.fromSecretsManager(clientId, 'CLIENT_ID'),
        SPOTIFY_CLIENT_SECRET: ecs.Secret.fromSecretsManager(clientSecret, 'CLIENT_SECRET'),
      },
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'TunedInBackend' }),
    });

    // Grant the task role permissions to read the secrets
    clientId.grantRead(taskDefinition.taskRole);
    clientSecret.grantRead(taskDefinition.taskRole);

    // Create a service
    const service = new ecs.Ec2Service(this, 'TunedInBackendService', {
      cluster,
      taskDefinition,
      desiredCount: 1,
    });

    // Create an Application Load Balancer
    const lb = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc,
      internetFacing: true
    });

    const listener = lb.addListener('Listener', {
      port: 80,
    });

    listener.addTargets('ECS', {
      port: 80,
      targets: [service],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(60),
      }
    });

    // Output the load balancer DNS name
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: lb.loadBalancerDnsName
    });
  }
}