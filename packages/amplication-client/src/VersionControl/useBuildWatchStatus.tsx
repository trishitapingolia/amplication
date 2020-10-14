import { useEffect } from "react";
import { gql } from "apollo-boost";
import { useQuery } from "@apollo/react-hooks";

import * as models from "../models";

const POLL_INTERVAL = 1000;
/**
 * Pulls updates of the build from the server as long as the build process is still active
 */
const useBuildWatchStatus = (build: models.Build) => {
  const { data, startPolling, stopPolling } = useQuery<{
    build: models.Build;
  }>(GET_BUILD, {
    onCompleted: () => {
      //Start polling if build process is still running
      if (data?.build.status === models.EnumBuildStatus.Running) {
        startPolling(POLL_INTERVAL);
      }
    },
    variables: {
      buildId: build.id,
    },
    skip: build.status !== models.EnumBuildStatus.Running,
  });

  //stop polling when build process completed
  useEffect(() => {
    if (data?.build.status !== models.EnumBuildStatus.Running) {
      stopPolling();
    }
  }, [data, stopPolling]);

  //cleanup polling
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);
};

export default useBuildWatchStatus;

const GET_BUILD = gql`
  query build($buildId: String!) {
    build(where: { id: $buildId }) {
      id
      appId
      version
      message
      createdAt
      actionId
      action {
        id
        steps {
          id
          name
          completedAt
          status
        }
      }
      createdBy {
        id
        account {
          firstName
          lastName
        }
      }
      status
      archiveURI
      deployments {
        id
        status
        environment {
          id
          name
          address
        }
      }
    }
  }
`;
