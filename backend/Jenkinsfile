pipeline {
    agent any

    environment {
        IMAGE_NAME = "yeonwoo02/ddip-backend"
        IMAGE_TAG = "latest"
        DEPLOY_DIR = "/home/ubuntu/backend"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-hub',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                }
            }
        }

        stage('Build Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME:$IMAGE_TAG ./backend'
                sh 'docker build -t yeonwoo02/ddip-elasticsearch:latest ./backend/elasticsearch'
            }
        }

        stage('Push Image') {
            steps {
                sh 'docker push $IMAGE_NAME:$IMAGE_TAG'
                sh 'docker push yeonwoo02/ddip-elasticsearch:latest'
            }
        }


        stage('Deploy to EC2') {
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ubuntu@$EC2_HOST "
                      cd $DEPLOY_DIR &&
                      docker pull $IMAGE_NAME:$IMAGE_TAG &&
                      docker compose up -d
                    "
                    '''
                }
            }
        }
    }
}